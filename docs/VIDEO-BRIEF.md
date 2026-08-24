# FIRST SCENE — the film (Google Veo production kit)

The marketing video is the four acts, shot as real cinema. Six 8-second Veo
clips cut together into ~40 seconds, plus a one-shot teaser. Type is added in
the edit, never generated — Veo garbles on-screen text, and our typography is
the brand anyway.

The one sentence the film argues:
**right person. wrong first date.** — and the room is what changes.

---

## The consistency block (paste at the top of EVERY prompt, verbatim)

> Shot on 35mm film with visible grain and soft halation, warm tungsten
> highlights against deep ink-black shadows, shallow depth of field, handheld
> intimacy, blue-hour college-campus world. A South Asian woman in her early
> twenties, dark hair loosely tied up, small gold earrings, cream knit
> sweater. A tall East Asian man in his early twenties, dark curly hair,
> olive canvas jacket over a white tee. Cinematic, natural, un-posed — a
> disposable-camera memory, not an advertisement.

Same wording every time = the closest Veo gets to a consistent cast.

---

## SHOT 01 — the text arrives (8s, 16:9)

> [consistency block]
> A dark dorm room at night, lit only by a desk lamp. A phone lies face-down
> on a wooden desk beside an open notebook. The phone buzzes once and its
> glow blooms against the wall — the room fills with soft blue light for a
> heartbeat, then settles. Nobody is in frame. Slow push-in toward the phone,
> ending close. Audio: quiet room tone, one soft message chime, distant
> campus sounds through a window.

Post: overlay `WED · 7:00 PM` then the bubble `found someone.` in our type.

## SHOT 02 — the wrong first date (8s, 16:9)

> [consistency block]
> A fluorescent-lit campus café, slightly too bright, slightly too quiet. The
> woman and the man sit stiffly across a small table, two untouched coffee
> cups between them. They both reach for something to say and don't find it;
> she straightens her cup, he looks at the menu board. Locked-off static
> camera, symmetrical, uncomfortable. The frame never moves. Audio: harsh
> café room tone, a cup set down too loudly, an espresso machine hiss,
> no music.

Post: `right person.` … beat … `wrong first date.`

## SHOT 03 — the world turns (8s, 16:9) ← THE JAW-DROP

> [consistency block]
> The café begins to rotate like a theater set on a turntable while the two
> people stay seated at the center. Walls glide away, the table slides
> offscreen, and new rooms sweep past them in one continuous move — a gallery
> with white walls and one spotlight painting, a warm bookstore aisle with
> ladders and lamplight — furniture and light changing around the motionless
> couple. One continuous camera orbit, no cuts, seamless physical
> transformation, stage machinery made invisible. Audio: a deep mechanical
> rumble like scenery moving, a rising tone, papers fluttering.

Post: the dial UI ghosted in a corner; tick sounds from the site's own audio.

## SHOT 04 — the snap (8s, 16:9)

> [consistency block]
> Night outside a small theater, marquee bulbs glowing warm, a crowd
> spilling onto a rain-wet street full of neon reflections. The woman and the
> man walk out mid-laugh, shoulder to shoulder, still talking about the show,
> gesturing — caught mid-motion, imperfectly framed, flash-photograph energy.
> Steadicam tracking backwards in front of them at walking pace. Street food
> steam crosses the frame. Audio: street ambience, their overlapping laughter
> (no clear words), a warm music swell that resolves on a single note.

Post: `THIS ONE.` … `they don't need more compatibility. they need less pressure.`

## SHOT 05 — the handoff (8s, 16:9)

> [consistency block]
> A late-night taco stand counter, warm string lights. Two phones are placed
> face-down on the counter, side by side, screens dark. Beyond them,
> out-of-focus, the woman and the man walk away down the street together,
> getting smaller, still talking. The camera stays with the phones and slowly
> racks focus from the phones to the couple, then lets them go soft again.
> Audio: sizzling griddle, night street, their voices fading, then quiet.

Post: `you two take it from here.` … `go have a real life.`

## SHOT 06 — the world is big (8s, 16:9, closer)

> [consistency block]
> Very wide blue-hour shot of a college campus green, an old lit building
> behind trees, lamps coming on. Two tiny figures cross the lawn together,
> almost lost in the scale of the evening. Slow rising crane move, the sky
> holding the last warmth of sunset. Audio: wind, distant voices, one final
> soft piano note that stops — two seconds of near-silence to end.

Post: `FIRST SCENE` · `first-scene.vercel.app` · `a concept build for Ditto.
everyone here is synthetic.`

---

## THE ONE-SHOT TEASER (8s, both 16:9 and 9:16)

If only one clip exists, it is Shot 03 alone with this ending change:

> …the final room locks into place as the rotation stops: the theater-exit
> street at night, marquee light washing over the couple as they rise from
> the table already laughing, the table itself gliding away behind them.

Vertical (9:16) note for Reels/TikTok: reframe prompts with "vertical
composition, subjects centered, headroom for text above."

---

## Veo craft notes

- 8s per generation; write one continuous camera move per prompt, never "cut to".
- Never ask Veo for on-screen text, logos, or UI — add all type in the edit.
- Keep the consistency block verbatim; regenerate a shot rather than accept a
  cast drift.
- Ask for "imperfect framing, un-posed, disposable-camera energy" every time
  or Veo drifts toward advertisement gloss.
- Generate 2–3 takes per shot; the best take is usually the second.
- Audio directions work in Veo 3 — write them; the mechanical-turntable rumble
  in Shot 03 is half the jaw-drop.

---

## Still-image prompts (posters / thumbnails / social)

Same consistency block applies where people appear.

**The ticket (hero poster)**
> Macro photograph of a cream paper ticket lying on rain-wet asphalt at
> night, neon signage reflecting pink and blue in the wetness around it. The
> ticket has a torn bottom edge and two punched holes, blank where text would
> be. One corner slightly lifted. Shot on 35mm, heavy grain, shallow focus,
> tungsten warmth against ink shadows.

**The dial (object hero)**
> Product photograph of a physical brass-and-black rotary dial standing on a
> matte black surface, one notch marked in fluorescent pink, a paper-white
> center hub, dramatic single warm light from the left, deep shadows, film
> grain, no text anywhere.

**Six rooms (contact sheet)**
> A photographic contact sheet of six frames on dark paper: an empty café
> table, a bookstore aisle, a gallery wall with one painting, a theater-exit
> street at night, a table set for four, a library desk under a lamp — all
> empty of people, warm and cold lights alternating, 35mm grain, slight
> sprocket edges visible.

**The laugh (the human frame)**
> [consistency block] Flash photograph, slightly overexposed at the edges:
> the woman and the man caught mid-laugh on a night street, motion blur in
> their hands, marquee bulbs bokeh behind them, imperfect tilt to the frame,
> the most alive moment of an evening.

**The phones face-down (the thesis still)**
> Two phones lying face-down side by side on a diner counter under warm
> string lights, a blurred couple walking away in the deep background of the
> frame, night street bokeh, 35mm grain, quiet and warm.

---

Provenance note: everything the film shows is the concept build's synthetic
world. Keep the closer's "concept build" line in every public cut.
