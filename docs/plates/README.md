# Hero plates

Nine clean WebGL captures, ~2000 × 1250, straight from the running site. **No UI
text is baked in** — that is what makes them plates rather than screenshots. Put
your own typography on top.

Everything here is the real render at the real resolution. Nothing was generated,
retouched, or composed.

---

## The plates

| file | what it is | composition |
|---|---|---|
| `zoom-world.png` | the campus from 86 units out, with the one lit Maya–Jonah thread | **subject left, empty right** — the natural headline plate |
| `zoom-connection.png` | the same thread from 8 units, where it becomes two people | centred pair |
| `zoom-human.png` | one of them, close | fills frame, softest |
| `network-missing-edge.png` | 96 people, and the two nodes nobody can introduce, in acid | fills frame |
| `gravity-holding.png` | two bodies locked, mint pulls above, acid pushes below | centred object, wide margins |
| `gravity-drifting.png` | the same pair after the week breaks | centred, further apart |
| `index-constellation.png` | every surface on the site, sized by what it costs to read | centred ring |
| `weather-alive.png` | friday — the campus warm | fills frame |
| `weather-closed.png` | midterm wednesday — everybody present, nothing left in them | fills frame, cold |

---

## Pairs worth using together

**`gravity-holding` → `gravity-drifting`.** Same two people, before and after the
week breaks. The clearest before/after on the site.

**`weather-alive` → `weather-closed`.** Same campus, same positions, same people.
Only the temperature changes — which is the entire point of that surface, and it
reads instantly side by side.

**`zoom-world` → `zoom-connection` → `zoom-human`.** The three scales of one
continuous camera move, in order. A three-panel strip tells the whole zoom
without a word.

---

## Notes for composing

- Background is `#0B0907`. Bleed into it and the seams disappear.
- `zoom-world` is the only plate with deliberate negative space. Headline goes
  right of the constellation.
- The missing-edge thread in `network-missing-edge.png` is one pixel wide at this
  resolution and reads as subtle. The two acid nodes carry the idea; if the
  thread needs to be louder, draw it in the composite.
- Nothing here contains a face, a real place, or any readable text — the
  constraints in [IMAGE-BRIEF.md](../IMAGE-BRIEF.md) hold for these too.

---

## How they were made

`preserveDrawingBuffer` was enabled on the five canvases, each page was driven to
the state worth shooting, `canvas.toDataURL()` was posted to a temporary dev-only
route that wrote the PNG, and then **both the flag and the route were removed**.
Neither is in the repo. Re-shooting means putting them back.

For `network-missing-edge` the candidate thread pulses on a ~2.6 second period,
so four frames were taken across the phase and the brightest kept, measured by
counting acid-range pixels rather than by eye.
