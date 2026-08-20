# RESEARCH

Everything this project claims about Ditto, sorted by how much I actually know.

Research conducted **2026-08-19**. I have no access to Ditto's systems, code,
data, infrastructure or private metrics, and nothing in this repository was
obtained from any of those.

---

## VERIFIED

Stated on Ditto's own public site or in first-party material quoted by named
press. Each item is something Ditto says about itself.

| Claim | Source |
|---|---|
| Ditto is a college matchmaker. Positioning line: "tired of tinder & hinge? Ditto is for you" | [tryditto.com](https://tryditto.com) |
| Marketing headline: **"Date Without Swiping"** | [tryditto.com/social](https://tryditto.com/social) |
| Founded by **Allen Wang** and **Eric Liu**, both UC Berkeley dropouts | [Wikipedia](https://en.wikipedia.org/wiki/Ditto_(dating_service)), [Forbes](https://www.forbes.com/sites/sofiachierchio/2026/07/11/these-gen-z-founders-are-reinventing-dating-apps-without-the-swipe/) |
| **$9.2M seed**, Feb 2026, led by Peak XV Partners; Gradient, Scribble Ventures, Alumni Ventures, Llama Venture participating | [GlobeNewswire](https://www.globenewswire.com/news-release/2026/02/03/3231154/0/en/Ditto-raises-9-2M-to-replace-swiping-with-real-dates-for-college-students.html) |
| Preferences submitted by **Tuesday 11:59 PM**; matches drop by **iMessage at 7pm Wednesday** | [tryditto.com/how-it-works](https://tryditto.com/how-it-works) |
| One match per drop. Manifesto: "One match. One person. One introduction." | [tryditto.com/manifesto](https://tryditto.com/manifesto) |
| Match arrives as a **poster with photos and a compatibility explanation** | [tryditto.com/how-it-works](https://tryditto.com/how-it-works) |
| After the match, both parties **share availability** and Ditto arranges the specific time and location | [tryditto.com/how-it-works](https://tryditto.com/how-it-works) |
| Dates take place at **on-campus coffee spots** | [tryditto.com/how-it-works](https://tryditto.com/how-it-works) |
| Post-date **feedback** feeds rematching and profile adjustment | [tryditto.com/how-it-works](https://tryditto.com/how-it-works) |
| Stated philosophy: technology should **"make the introduction, then get out of the way"** | [tryditto.com/manifesto](https://tryditto.com/manifesto) |
| Manifesto refrain: "The best connection doesn't happen on a screen. It happens in real life." | [tryditto.com/manifesto](https://tryditto.com/manifesto) |
| Public figures: 80,000+ dates arranged; 65% and 92% outcome metrics; 70% get a first date within 2 days | [tryditto.com/how-it-works](https://tryditto.com/how-it-works) |
| **20% of matched pairs actually go on the date** | [TechCrunch, 2026-08-06](https://techcrunch.com/2026/08/06/gen-z-dating-apps-like-ditto-ditch-swiping-in-favor-of-ai-matchmaking/) |
| 150,000 signups; "a few dozen" colleges; 12 full-time employees (Aug 2026) | [TechCrunch, 2026-08-06](https://techcrunch.com/2026/08/06/gen-z-dating-apps-like-ditto-ditch-swiping-in-favor-of-ai-matchmaking/) |
| Matching is on personality rather than shared hobbies. Wang: *"chemistry is actually predictable with the right signals"* | [TechCrunch, 2026-08-06](https://techcrunch.com/2026/08/06/gen-z-dating-apps-like-ditto-ditch-swiping-in-favor-of-ai-matchmaking/) |
| Verification is **.edu email**, and scaling it beyond campus is a stated open problem | [TechCrunch, 2026-08-06](https://techcrunch.com/2026/08/06/gen-z-dating-apps-like-ditto-ditch-swiping-in-favor-of-ai-matchmaking/) |
| A web onboarding flow exists at `app.ditto.ai/join`: ~24 steps, chat-framed, phone-number auth, Google Maps date-radius step | Direct observation of the live flow, 27 screenshots, 2026-08-19 (`reference/`) |
| Frontend is **Next.js on Vercel** (`/_next/image` optimisation, `dpl_` deployment params in asset URLs) | Source inspection of tryditto.com, 2026-08-19 |

## REASONABLE PRODUCT INFERENCE

Follows logically from the verified behaviour above, but is **not** confirmed
implementation detail. Nothing here should be repeated as fact about Ditto.

- **The web onboarding is a client-side state machine.** All ~24 steps run at one
  unchanging URL (`/join`) with no path or query change, which is what that
  looks like from outside. The actual implementation is unknown.
- **SMS/phone is the account identity.** The flow collects a phone number with
  full TCPA autodialer consent and never collects a password, email or OAuth
  grant. Which provider handles it is unknown.
- **Match volume is user-throttleable.** The onboarding asks "how do u want ditto
  to match u rn?" with four pace options, which implies the answer reaches
  something. How, and with what effect, is unknown.
- **PostHog is plausible but unconfirmed.** It is a common Next.js/Vercel pairing
  and was reported to me as an earlier observation; I did not verify it in the
  current source and do not rely on it.
- **The 20% match-to-date figure implies venue/logistics loss, not only matching
  loss.** This is my reading, and it is the reading the whole project is built
  on. Ditto has not said this.

## SYNTHETIC PROTOTYPE ASSUMPTION

Invented for FIRST SCENE. None of this exists at Ditto and none of it is a claim
about how Ditto works.

- **Every person.** Maya, Jonah, Priya and Theo are fictional, as is "Westbrook".
  No real student data, profiles, or photographs were used anywhere.
- **Every portrait.** Procedurally drawn abstract figures generated in a canvas
  (`src/lib/portrait.ts`). No image generation capability was available, so
  rather than pass off stock photographs of real people as "synthetic", the
  portraits depict nobody at all.
- **The six scenes**, their times, venues, artifacts and copy.
- **`SceneEvaluation` and all eleven of its dimensions.** The dimension set is my
  invention. Ditto has never published a scoring schema.
- **The utility function and its ten weights** (`src/lib/rankScenes.ts`). A
  deterministic linear model I wrote. It is not a model Ditto uses, and it is not
  claimed to be a good model — it is claimed to be an *inspectable* one.
- **Every number in the decision view.** All metric values are hand-authored to
  make two specific points: that context dominates, and that a different pair
  inverts the ranking.
- **The "hear me out" contradictions** and the revealed-preference readings.
- **The feedback interpretation**, whether produced by the deterministic reader
  or the optional model route.
- **The invite/odds mechanic is *not* reproduced here.** Ditto's real onboarding
  ends on a slot machine showing a personal match probability; FIRST SCENE
  deliberately does not copy it.

### Claims from third-party concept documents, checked

A set of externally-generated concept documents was supplied as input. Several
made specific factual claims about Ditto. I checked them before reusing anything,
and did not carry forward what failed.

| Claim in those documents | Verdict |
|---|---|
| **Elsa Cai** is Head of Growth & Creative Director at Ditto | **VERIFIED.** LinkedIn profile, USC 2025–27, Los Angeles. |
| Ditto runs **~1,000 date simulations** per match | **REPORTED, NOT FIRST-PARTY.** Appears near-verbatim across several secondary write-ups (Substack, Medium, an AI-tools blog), which indicates a single origin — most likely one press piece or deck — rather than independent confirmation. Not present on Ditto's own site. Treated as reported, never as architecture. |
| Ditto has a **3-agent architecture** (Analysis / Matchmaking / Simulation agents) | **NOT VERIFIED.** A three-*stage* pipeline is described in secondary press; "three agents" is the concept document's own framing layered on top. No first-party source found. |
| 163,000 students · 100+ schools · 69% match rate · $9.5M raised | **INCORRECT OR STALE.** Verified figures: 130,000 students who went on dates, $9.2M seed (reported elsewhere as "more than $9M" / "$10M backed"). The 69% match rate is unsourced. |

Consequence: the strongest concept in those documents — a visual companion layer
that renders Ditto's "three agents" at work — was **not built**, because it is
constructed entirely on the one claim that failed verification. Shipping a
fabricated internal architecture to the company that owns the real one is the
specific failure mode this project was told to avoid.

What *was* taken from them is the idea below, which needs no claim about Ditto's
internals to stand up.

### Things I specifically did not claim

No agent counts. No simulation counts. No model architecture. No ranking weights
attributed to Ditto. No internal tooling, database, or infrastructure claims. No
private metrics. Where an earlier brief suggested such specifics, I did not carry
them forward, because I could not verify them from a first-party source.

---

## Where this attaches to the real product

Ditto's public journey is:

```
preferences  →  Wednesday 7pm match  →  explanation  →  availability
             →  Ditto picks time + place  →  date  →  feedback
```

FIRST SCENE attaches at **step 5** — after the match exists and before the plan
is fixed. That is the only step where the *pair is already decided* and the
*context is still open*, which is exactly the seam the thesis lives in.

It is also the step where Ditto's own site says the answer is currently an
on-campus coffee spot.
