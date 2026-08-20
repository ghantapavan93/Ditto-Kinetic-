# Ditto — product & implementation teardown

Reverse-engineered from 26 screenshots of `app.ditto.ai/join` and `tryditto.com/social`
captured 2026-08-19. Everything here is **observed from the UI**; anything that is an
inference about the implementation is marked _(inferred)_.

Source screenshots: `~/OneDrive/Pictures/Screenshots/Screenshot 2026-08-19 19*.png`

---

## 1. What the product actually is

Ditto is a **college dating app that removes the swipe deck entirely**.

- Marketing site `tryditto.com` leads with "Date Without Swiping".
- There is no browse/discovery surface anywhere in the flow. You fill out a long
  profile, then land on a home screen that says *"Ditto is finding you a date!"*.
- Matching is **batched, not continuous** — the invite screen refers to
  *"your chance of matching on drop day"*. Matches drop as an event, not a feed.
- The interface persona is **Ditto**, an AI concierge. Every onboarding question is
  framed as a chat message from `Ditto`, and the home screen's primary CTA is
  "Message Ditto". Delivery is over SMS _(inferred — signup collects a phone number
  with autodialer/marketing consent and never collects a password)_.
- It is **cohort-scoped**. The onboarding header reads `back to school date` — that
  is a campaign/season name, not the app name. `tryditto.com/social` is a separate
  campus-social surface.

The strategic shape: replace *user does the searching* with *user submits a rich
preference vector, system does the matching*. That is why onboarding is ~24 steps
long instead of 4 — the profile **is** the product's input, not a formality.

---

## 2. Front-end architecture

### 2.1 Shell

Desktop renders a **fixed mobile viewport centred on a blurred hero photograph**.
There is no responsive desktop layout — the phone frame is the only layout, letterboxed.
This is a mobile-first web app that treats desktop as an incidental surface _(inferred)_.

Inside the frame, every onboarding screen shares the same chrome:

| Region | Contents |
|---|---|
| Top bar | `<` back chevron, campaign title (`back to school date`), lock icon (privacy) |
| Progress | 4-segment bar; segments are **phases**, fill within a segment is step progress |
| Body | Chat transcript from `Ditto` + the answer widget for the current step |
| Bottom-right | Circular next FAB — grey/disabled until the step validates, white/active when it does |

The back/next pair means every step is reversible. Answers persist when you go back
(the height, age and photo steps all show retained values).

### 2.2 Routing and state

The entire ~24-step flow lives at **one URL: `/join`**. No path or query changes
between steps. So this is a **client-side state machine** holding the whole answer
object in memory, persisting to the server at checkpoints rather than per-step
_(inferred from the unchanging address bar)_.

Practical consequence for a rebuild: model onboarding as an ordered array of step
descriptors + a single `answers` record, not as routes.

### 2.3 The chat costume

This is the single most important design decision to copy.

Each step renders as one or two **left-aligned bubbles attributed to `Ditto`**, with
the operative word bolded (`what's your **gender** ?`, `where u **going next** ?`).
The answer control sits underneath. Some steps stack a second bubble as a coaching
line (`now tell me about yourself` then `what are your **hobbies** & **interests** ?`).

It is a form. The chat framing exists to make a 24-step form feel like a conversation,
which is the difference between 40% and 80% completion on a profile this long.

Voice is deliberately lowercase and clipped — `what u training for ?`, `what's ur number ?`,
`how do u want ditto to match u rn?`. Sentence case appears only on privacy-sensitive
steps (`What's your ethnicity ?`, `What's your preferred age range ?`), which reads as
a register shift toward seriousness.

### 2.4 Visual system

- Background: a full-bleed photo per campaign, heavily blurred/darkened behind content.
- Unselected option pill: translucent white, blurred backdrop, full-width, pill radius.
- **Selected** option pill: solid mid-blue, white text, a check circle on the right, and it
  shifts ~6px left out of the stack — selection is signalled by colour, check, *and*
  displacement. Cheap and extremely legible.
- Bubbles: near-white, pill radius, dark navy text.
- Exactly one accent colour in onboarding (blue). Pink/magenta is reserved for the
  marketing site and the invite/celebration screens — a deliberate register change.

### 2.5 Input widget inventory

Eleven distinct widgets carry the whole flow. This is the real build backlog:

| # | Widget | Used by |
|---|---|---|
| 1 | `SingleSelectPill` | gender, ethnicity, year, politics, religion, intent, match pace |
| 2 | `MultiSelectPill` (+ `Other` inline text) | hobbies, travel style, training style, content taste, ethnicity preference |
| 3 | `InlineTextInput` (arrow submits) | next destination, training goal |
| 4 | `DateInput` `MM / DD / YYYY` | birthday |
| 5 | `PhoneInput` + consent block | phone |
| 6 | `DualRangeSlider` with tick marks | preferred age range (`19 - 24`) |
| 7 | `RulerSlider` + unit toggle `ft/in` / `cm` | height (`5'10"`) |
| 8 | `MapRadius` — Google Maps + minutes slider + mode toggle | date location (`30 mins max transit`) |
| 9 | `PhotoGrid` 3x2, 6 slots | profile photos, min 2 |
| 10 | `ImageChoice` 2x2, multi-round, own sub-progress bar | taste calibration |
| 11 | `Textarea` with "your match will see this" label | first thing your match should know |

Widgets 6–10 are the expensive ones. Everything else is one component with a data list.

### 2.6 Third-party surface

- **Google Maps JavaScript API** — the location step embeds a live map (`Map data ©2026 Google`),
  with a search-a-location autocomplete and a recentre-on-me button.
- **Browser Geolocation API** — Chrome's native permission prompt fires on that step.
- **SMS / phone verification** — the consent copy names autodialled marketing texts,
  `Reply HELP` / `Reply STOP`, and links Terms and Privacy Policy. TCPA-shaped.
  _(inferred: Twilio or similar)_
- No email, no password, no OAuth appears anywhere in the flow.

---

## 3. Privacy posture

Worth copying because it is doing real conversion work:

- A lock icon sits in the header on every step.
- Sensitive steps carry inline microcopy: `Private. Only used to match you`
  (ethnicity, ethnicity preference, age range, politics, religion).
- Birthday: `Only your age is shown to others.`
- Phone: `we'll text you when your match lands — never shown on your profile`
- Textarea: `your match will see this` — the inverse, marking what *is* public.

Each sensitive field states its blast radius *at the point of entry*. Nothing is
deferred to a privacy policy.

---

## 4. Growth loop

After the profile, before any payoff:

> **Invite a friend to lock in your match**
> Based on your profile, you have a **70%** chance of matching on drop day.
> Invite a friend for a guaranteed match!

Rendered as a **slot machine** with a pull lever and a `Current odds: 70%` readout,
plus an email/phone field and `Share my invite link`. `Skip` sits top-right.

The mechanic: surface a computed, personalised probability, then sell certainty for
one referral. The odds number is the whole trick — it must be per-user and legible.
Placement is exactly at peak sunk cost (24 steps in, zero payoff yet).

Post-signup, the loop repeats softer on the home screen: `Try double date — Bring a
friend and meet another pair together.` with an `Invite` button.

---

## 5. Post-signup home

- Full-bleed generated hero art, title **"Ditto is finding you a date!"** — the
  waiting state is the product state, not an empty state.
- Primary CTA: `Message Ditto` (chat/SMS with the concierge).
- Secondary card: double-date invite.
- Bottom nav, three tabs: **Ditto** (concierge), **Where** (place/venue),
  **You** (profile). Notably there is no Matches tab and no Discover tab.

---

## 6. What a rebuild has to get right

Ranked by how much of the experience they carry:

1. **One URL, one state machine, ~24 declarative step descriptors.** Get this shape
   right and the rest is component work.
2. **Chat framing with a bolded operative word.** Cheap, and it is what makes the
   length survivable.
3. **Selected-state treatment** (colour + check + displacement).
4. **Disabled-to-enabled FAB** as the only forward affordance.
5. **Per-field privacy microcopy** on anything demographic.
6. **`Other` escape hatch** on every multi-select.
7. **Computed personal odds + referral gate** before the payoff.
8. **Batch "drop day" matching** — no feed, no swipe deck, waiting is the state.

The five widgets that will consume most of the build time: ruler-slider height,
dual-thumb age range, map + transit-radius, 6-slot photo grid, and the multi-round
2x2 taste calibrator.
