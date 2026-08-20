# Onboarding flow — exact step spec

Every step observed at `app.ditto.ai/join`, in order, with its prompt copy, widget,
options and validation rule. Option lists are transcribed verbatim from the screenshots.

Steps not captured in the screenshot set are marked **[gap]** — the flow starts
mid-sequence at gender, so anything before it (name, .edu verification, campus
selection) is unconfirmed.

Legend for `widget` values maps to the inventory in [TEARDOWN.md](TEARDOWN.md#25-input-widget-inventory).

---

## Phase 1 — identity (progress segment 1)

**[gap]** — likely name / school / .edu email before this point. Not observed.

### 1. Gender
- Prompt: `what's your **gender** ?`
- Widget: `SingleSelectPill`
- Options: `Man`, `Woman`, `Nonbinary`
- Required.

### 2. Seeking
- Prompt: `Who are you looking to **date** ?`
- Widget: `MultiSelectPill` _(includes an `Everyone` catch-all, so likely multi)_
- Options: `Men`, `Women`, `Nonbinary`, `Everyone`
- Required.

### 3. Birthday
- Prompt: `when's your **birthday** ?`
- Footnote: `Only your age is shown to others.`
- Widget: `DateInput`, placeholder `MM / DD / YYYY`
- Required. Presumably 18+ gate.

### 4. Phone
- Prompt: `what's ur **number** ?`
- Consent block (shown above the field, full TCPA text): consent to marketing texts
  from Ditto at the number provided, including via autodialer; msg & data rates apply;
  `Reply HELP for help, reply STOP to stop`; mobile info not shared with third parties
  for marketing; links to **Terms** and **Privacy Policy**.
- Footnote: `we'll text you when your match lands — never shown on your profile`
- Widget: `PhoneInput`, placeholder `(555) 555-5555`
- Required. This is the account identity — no password is ever collected.

---

## Phase 2 — about you (progress segment 2)

### 5. Hobbies & interests
- Prompts (two bubbles): `now tell me about yourself` / `what are your **hobbies** & **interests** ?`
- Widget: `MultiSelectPill` + free-text row
- Options: `Cooking`, `Music`, `Travel`, `Reading`, `Gym`, `Gaming`, `Movies/TV`, `Art`
- Free-text row: `Type your hobby` with a pencil affordance
- Each option carries a leading emoji.

### 6. Travel style
- Prompt: `what's your **travel style** ?`
- Widget: `MultiSelectPill` + `Other`
- Options: `Backpacking`, `Luxury`, `Foodie tours`, `Adventure`, `Beach + sun`,
  `City-hopping`, `Solo travel`, `Road trips`, `Other`

### 7. Next destination
- Prompt: `where u **going next** ?`
- Widget: `InlineTextInput` (arrow submits), free-form city — observed value `New York`

### 8. Training style
- Prompt: `what's your **training style** ?`
- Widget: `MultiSelectPill` + `Other`
- Options: `Lifting`, `Running`, `Yoga`, `Pilates`, `Crossfit`, `Boxing`, `Dance`,
  `Cycling`, `Climbing`, `Other`

### 9. Training goal
- Prompt: `what u **training for** ?`
- Widget: `InlineTextInput`, placeholder `aesthetic, marathon, principle...`

### 10. Content taste
- Prompt: `what kinda **content** u like?`
- Widget: `MultiSelectPill` + `Other`
- Options: `Indie`, `Horror`, `Rom-com`, `Action`, `Sci-fi`, `Documentary`,
  `A24 stuff`, `Foreign`, `Anime`, `Reality TV`, `Other`

### 11. Ethnicity
- Prompt: `What's your **ethnicity** ?`
- Privacy note: `Private. Only used to match you`
- Widget: `SingleSelectPill` + `Other`
- Options: `American Indian`, `Black/African Descent`, `East Asian`, `Hispanic/Latino`,
  `Middle Eastern`, `Pacific Islander`, `South Asian`, `South East Asian`, `White`, `Other`

### 12. Ethnicity preference
- Prompt: `Any **ethnicity** preferences?`
- Privacy note: `Private. Only used to match you`
- Widget: `MultiSelectPill` with a `No Preference` option pinned first + `Other`
- Options: `No Preference`, then the same list as step 11.
- `No Preference` should clear and lock the rest.

### 13. Preferred age range
- Prompt: `What's your preferred **age range** ?`
- Privacy note: `Private. Only used to match you`
- Widget: `DualRangeSlider` over a tick-marked track; large readout pill above
  showing e.g. `19 – 24`

### 14. Height
- Prompt: `How **tall** are you?`
- Widget: `RulerSlider` — horizontal ruler with major/minor ticks, a centred blue
  indicator line, an inline `6'` label on the track, and a large readout pill
  showing e.g. `5'10"`
- Unit toggle beneath the ruler: `ft / in` and `cm`, segmented, `ft / in` default

### 15. Date location
- Prompt: `Where do you want to **date** ? 📍`
- Widget: `MapRadius`
  - Google Maps embed with a magenta reachability polygon and a filled centre pin
  - `Search a location` autocomplete row
  - Recentre-on-me button (triggers browser geolocation permission)
  - Below the map: readout `30 mins` + label `max transit`, a slider with tick marks,
    and a 3-way mode toggle: walk / transit / drive (transit selected in the capture)

---

## Phase 3 — photos & taste (progress segment 3)

### 16. Photos
- Prompts: `Let's add at least 2 photos 📷` / `Include a clear close-up and a full-body shot`
- Helper text: `Clear face photos from different moments help us find better matches
  for you. You can swap them anytime.`
- Widget: `PhotoGrid`, 3x2 = 6 slots. First slot is a solid `+` tile, the rest are
  dashed placeholders.
- Validation: minimum 2. FAB stays disabled below that.

### 17. Taste calibration
- Prompts: `Pick whoever catches your eye — it helps us learn your type. 👀` /
  `Which one's most your **type** ?`
- Widget: `ImageChoice` — 2x2 grid of face photos, tap to choose
- Has its **own** progress bar directly beneath the prompt, separate from the global
  one — this is a multi-round step (pick 1 of 4, repeated).
- Bottom-left shows a `← Back` pill instead of the usual FAB; advancing is implicit
  on selection.

### 18. Relationship intent
- Prompt: `What are you **looking for** ?`
- Privacy note: `Private. Only used to match you`
- Widget: `SingleSelectPill`
- Options: `Life partner`, `Serious relationship`, `Casual dates`, `New friends`, `Not sure yet`

### 19. Match pace
- Prompt: `how do u want ditto to **match u** rn?`
- Privacy note: `Private. Only used to match you`
- Widget: `SingleSelectPill`, each option with a leading emoji
- Options: `More dates, faster`, `A steady mix`, `Fewer, better matches`, `Wait for the one`
- This is the throttle on match volume — it should feed the matching batch size directly.

---

## Phase 4 — context & voice (progress segment 4)

### 20. Academic year
- Prompt: `what **year** are u going into this fall?`
- Widget: `SingleSelectPill`
- Options: `Freshman`, `Sophomore`, `Junior`, `Senior`, `Master`, `PhD`, `Other`

### 21. Political vibe
- Prompt: `what's your **political vibe** ?`
- Privacy note: `Private. Only used to match you`
- Widget: `SingleSelectPill` + `Other`
- Options: `Very left`, `Left-leaning`, `Center`, `Right-leaning`, `Very right`,
  `Apolitical`, `Other`

### 22. Political compatibility weight
- Prompt: `does your match have to share your **politics** ?`
- Privacy note: `Private. Only used to match you`
- Widget: `SingleSelectPill`
- Options: `doesn't matter`, `kinda matters`, `super important`
- Pairs with step 21 as a (value, weight) tuple for the matcher.

### 23. Religion
- Prompt: `what's your **religion** ?`
- Privacy note: `Private. Only used to match you`
- Widget: `SingleSelectPill` + `Other`
- Options: `Atheist`, `Agnostic`, `Christian`, `Catholic`, `Jewish`, `Muslim`,
  `Hindu`, `Buddhist`, `Spiritual`, `Other`

### 24. Opening line
- Prompts: `**first thing** your match should know?` / `this helps your match get to know you better`
- Public marker: `your match will see this`
- Widget: `Textarea`, multi-line, no visible counter — observed value
  `Simple, Overthinking, adventurous.`

---

## Post-profile

### 25. Invite gate
- Header: `Invite a friend to **lock in your match**`
- Body: `Based on your profile, you have a **70%** chance of matching on drop day.
  Invite a friend for a guaranteed match!`
- Slot-machine graphic with a pull lever; readout `Current odds: 70%`
- Input: `Type their email or number`
- Secondary: `Share my invite link`
- `Skip` in the top-right — the gate is soft.
- Visual register flips to pink/magenta here. Onboarding chrome (progress bar,
  campaign title) is gone.

### 26. Home
- URL drops to `app.ditto.ai` (no `/join`).
- Wordmark `Ditto` top-left, hamburger top-right.
- Hero art + title `Ditto is finding you a date!`
- Primary CTA: `Message Ditto` (chat glyph)
- Card: `Try double date 💕` / `Bring a friend and meet another pair together.` /
  `Invite` button
- Bottom nav, 3 tabs: `Ditto` (active), `Where`, `You`

---

## Suggested data model

```ts
type Onboarding = {
  // phase 1
  gender: 'man' | 'woman' | 'nonbinary'
  seeking: Array<'men' | 'women' | 'nonbinary' | 'everyone'>
  birthday: string              // ISO date; only derived age is public
  phone: string                 // E.164; account identity, never public
  smsConsentAt: string          // ISO timestamp — retain for TCPA

  // phase 2
  hobbies: string[]             // known slugs + free-text
  travelStyles: string[]
  nextDestination: string
  trainingStyles: string[]
  trainingGoal: string
  contentTastes: string[]
  ethnicity: string             // private
  ethnicityPreference: string[] // private; ['no_preference'] is exclusive
  ageRange: { min: number; max: number }   // private
  height: { cm: number; displayUnit: 'imperial' | 'metric' }
  dateArea: {
    center: { lat: number; lng: number }
    maxMinutes: number
    mode: 'walk' | 'transit' | 'drive'
  }

  // phase 3
  photos: string[]              // >= 2, <= 6, ordered
  typeSignals: string[]         // chosen photo ids from calibration rounds
  intent: 'life_partner' | 'serious' | 'casual' | 'friends' | 'unsure'
  matchPace: 'faster' | 'steady' | 'fewer_better' | 'wait_for_the_one'

  // phase 4
  academicYear: 'freshman' | 'sophomore' | 'junior' | 'senior' | 'master' | 'phd' | 'other'
  politics: string              // private
  politicsWeight: 'none' | 'some' | 'high'   // private
  religion: string              // private
  opener: string                // public
}
```

Field visibility is not cosmetic here — the UI promises it per field. Encode
`private` / `public` on the schema and let the profile serializer enforce it, rather
than trusting each read site.
