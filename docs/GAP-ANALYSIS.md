# Ditto — what exists, what doesn't, and where this project aims

Research refresh, 2026-08-20. Supersedes nothing in [TEARDOWN.md](TEARDOWN.md) — that
documents the UI as captured. This documents **what is publicly evidenced about the
product today**, separates it from what is not, and states where this project's
additions actually land.

> **No access to Ditto systems.** Nothing here is from Ditto's internal
> infrastructure, private metrics, or source. Everything is either first-party
> public (their own site) or reputable press, cited inline. Inferences are marked.

---

## 1. Evidence grades

| Grade | Meaning |
|---|---|
| **[1P]** | First-party public — ditto.ai, their own copy |
| **[P]** | Reputable press |
| **[OBS]** | Observed in the 27 screenshots in [`reference/`](../reference) |
| **[INF]** | Our inference. Not a claim about Ditto. |
| **[UNVERIFIED]** | Circulating publicly, traced only to third-party blogs. **Not repeated as fact.** |

---

## 2. What Ditto demonstrably has

**The loop** [1P]
1. "Submit your preferences by Tuesday 11:59 PM"
2. "The Wednesday Drop — Check your iMessage at 7pm. We will send you one personalized match"
3. "Schedule the Date — Find a time that works for both of you to meet up"
4. "Have fun!"

**Scale** [1P] — "164,294+ students", "100+ schools joined", "80,000+ dates arranged".
[P] TechCrunch (2026-08-06) reports 150,000 signups, "a few dozen colleges", $9.2M seed.

**They pick the room.** [P] Ditto sends "person, time, and location". [1P] The site
says "Coffee dates on campus." So location *is* selected — and the selection is
effectively a constant.

**A scheduler exists.** [P] Both users fill out an availability scheduler; Ditto then
arranges time and place and supplies dating tips.

**A feedback loop exists.** [P] Ditto collects feedback after each date and uses it to
refine subsequent matching — including "the reason why they don't like a match".

**Double dates exist.** [OBS] Post-signup home carries "Try double date — Bring a
friend and meet another pair together."

**Growth is built into the funnel.** [OBS] A slot-machine referral gate showing a
computed personal probability ("you have a 70% chance of matching on drop day"),
placed 24 steps in and before any payoff.

**Verification is `.edu`.** [P][1P] "Verified students at your school only."

**Navigation is three tabs.** [OBS] `Ditto` (concierge) · `Where` · `You`. No matches
tab. No discover tab. The waiting state is the product state.

**Their stated philosophy** [1P, manifesto]:
> "The problem isn't that we need more options—it's that we need better reasons to connect."
> "We use technology to make the introduction, then get out of the way."

---

## 3. The number everything points at

[P] **"about 20% of those matches end up going out on a date."**

Four out of five matched pairs never meet. Ditto publishes the funnel's biggest leak,
and it sits precisely between "we sent you a match" and "you had a date" — which is
the only span this project has ever been about.

Every feature below is scored against that number and nothing else.

---

## 4. What is not evidenced anywhere

Absence of public evidence is not proof of absence — these are openings, not
accusations. [INF] throughout.

1. **No visible reasoning.** The match arrives as an assertion. Nothing public shows
   *why this person, why this time, why this room*. Co-founder Wang: "chemistry is
   actually predictable with the right signals" [P] — the signals are never shown.
2. **The room is a default, not a variable.** Location is chosen, and it is coffee.
   Nothing indicates it ranges over alternatives per pair.
3. **No abstention.** One match every Wednesday. Nothing indicates the system ever
   declines to send when it should wait.
4. **No uncertainty.** No public signal of confidence, or of the system knowing how
   little it knows about a new user.
5. **Nothing structured for the first fifteen minutes.** "Dating tips" [P] exist; a
   model of the hardest part of the evening does not appear to.
6. **Identity ends at the campus boundary.** `.edu` works until they leave college,
   which they have said they intend to do. No announced replacement.

---

## 5. Claims we refuse to repeat

**[UNVERIFIED] "runs a full date simulation across a thousand hypothetical
interactions."** This circulates in third-party write-ups. It is not on ditto.ai, and
it is not in the TechCrunch reporting. It is exactly the kind of internal-architecture
claim this project has committed never to assert on Ditto's behalf, so it appears
nowhere in the product surface — and the possibility cloud's copy explicitly says the
opposite about itself: *"seven is a way of drawing a range, not a number of anything
that was run."*

Likewise: no claim here about model architecture, agent counts, ranking weights,
internal tooling, or production infrastructure.

---

## 6. Where this project lands

| Their gap | Our surface | Aimed at |
|---|---|---|
| Room is a constant | `/` — six rooms ranked per pair | the 20% |
| No visible reasoning | THE ROOM — three lenses that sum to the utility | trust |
| No uncertainty shown | the possibility cloud | trust |
| No abstention | `/held-back` — what was not sent, and what it waits for | the 20% |
| Onboarding asserts a finished person | `/profile` — three questions, gaps left visible | trust |
| Nothing about the first 15 min | the first-fifteen scrubber | the 20% |
| Feedback exists but is invisible | `/after` — beliefs struck through, never deleted | trust |
| Double date is an invite, not a decision | `/double` — cover, eclipse, dilution | the 20% |

The alignment worth noticing: their manifesto already says *"we use technology to make
the introduction, then get out of the way."* This prototype's ending — the interface
deleting itself once the plan is real — is that line implemented rather than stated.

---

## 7. What is still missing, ranked

Scored by distance to the 20% number.

1. **The scheduling gap.** [P] Both people fill an availability scheduler; the
   evidenced failure is that four in five never meet. A calendar that finds a slot
   both are *free* in is not the same as one both are *alive* in, and this project
   already has the dimension for it. Highest-value remaining build.
2. **An application shell.** Eight cinematic pages are an argument, not a product.
   Ditto's own shape — a phone, three tabs, a waiting state — is the frame these
   surfaces should be reachable inside.
3. **Post-campus identity.** Open at Ditto, unaddressed here.
4. **Safety as a surface.** `.edu` is the whole mechanism publicly. Untouched here,
   and deliberately — it needs domain expertise this project does not have.

---

## Sources

- [Ditto — ditto.ai](https://ditto.ai/) (first-party, retrieved 2026-08-20)
- [Ditto — Manifesto](https://ditto.ai/manifesto) (first-party, retrieved 2026-08-20)
- [Gen Z dating apps like Ditto ditch swiping in favor of AI matchmaking — TechCrunch, 2026-08-06](https://techcrunch.com/2026/08/06/gen-z-dating-apps-like-ditto-ditch-swiping-in-favor-of-ai-matchmaking/)
- [Ditto raises $9.2M — GlobeNewswire, 2026-02-03](https://www.globenewswire.com/news-release/2026/02/03/3231154/0/en/Ditto-raises-9-2M-to-replace-swiping-with-real-dates-for-college-students.html)
- [These Gen Z Founders Are Reinventing Dating Apps, Without The Swipe — Forbes, 2026-07-11](https://www.forbes.com/sites/sofiachierchio/2026/07/11/these-gen-z-founders-are-reinventing-dating-apps-without-the-swipe/)
- 27 screenshots of `app.ditto.ai/join` and `tryditto.com/social`, captured 2026-08-19, in [`reference/`](../reference)

Not Ditto: `dittolive` (edge database company) and "Ditto. Live Video Connections"
(unrelated app on both stores). Both surface in searches and neither is this product.
