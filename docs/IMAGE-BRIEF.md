# Image brief

What to generate, what not to, and where each file goes.

---

## 0. Read this first

**This project currently ships zero image assets.** Every texture, every portrait
and the Open Graph card are generated procedurally at runtime — canvas, CSS and
`ImageResponse`. That is a deliberate position and it has two consequences worth
knowing before adding a single file:

1. **Adding images has a cost the site itself measures.** [`/attention`](../src/app/attention/page.tsx)
   argues that every pixel is something the reader spends. Heavy assets are the
   same argument in bandwidth. Keep every file under the budgets below.
2. **Nothing currently needs an image to work.** Everything below is an upgrade,
   not a repair. If a file does not clearly beat the procedural version, do not
   ship it.

### The hard constraint

> **No photorealistic human faces. Not for Maya, Jonah, Priya, Theo, Noor, Sam,
> or anyone on the campus.**

Every person in this project is synthetic, the disclosure on every page says so,
and the entire privacy position — the frosted signals, the refusal to draw
strangers as dots — depends on that being visibly true. A photoreal face makes
the work look like it used a real person, and no caption undoes that impression.

Portraits stay procedural. That is not a placeholder; it is the answer.

---

## 1. Worth generating, ranked

### ① Six room plates — **highest value**

The one place real imagery genuinely beats what is there. The site's whole claim
is that *the room is the variable nobody moves*, and it currently argues that
with typography. Six photographs of six rooms would let it argue with the rooms.

**Critically: the rooms are empty.** No people, no figures, no silhouettes. An
empty room waiting is the thesis — and it also sidesteps the constraint above
entirely.

| file | room | what it is |
|---|---|---|
| `public/rooms/coffee.webp` | campus café | two chairs, one small table, nothing else happening |
| `public/rooms/mission.webp` | campus bookstore | narrow aisle, crowded shelves, one gap where a book was taken |
| `public/rooms/gallery.webp` | student gallery | white wall, hung work out of focus, polished floor |
| `public/rooms/postshow.webp` | theatre exit → tacos | wet pavement at night, a lit doorway behind, street food light ahead |
| `public/rooms/group.webp` | small group event | six chairs in a loose ring, one pulled slightly out |
| `public/rooms/study.webp` | library steps | wide stone steps at dusk, strip-lit doorway above |

**Spec.** 1600 × 1000, WebP, quality ~72, **under 180 KB each**. Dark, low
contrast, nothing brighter than about 60% — these sit behind text and must not
fight it.

**Base prompt** (swap the subject line per room):

```
35mm film photograph, [SUBJECT], completely empty, no people, no figures.
Late evening, warm tungsten light from one practical source, deep shadow
elsewhere. Muted amber and cold blue only. Shallow depth of field, visible
grain, slight halation on the highlights. Underexposed by one stop. Editorial,
patient, unglamorous. No text, no logos, no signage, no brand marks.
```

Add per room: `two wooden chairs and one small round table by a window` /
`a narrow bookshop aisle` / `a white gallery wall with unfocused framed work` /
`wet night pavement outside a lit theatre door` / `six chairs in a loose circle
in a plain room` / `wide stone library steps at dusk`.

**Reject any output that contains a person, a face, a reflection of a person, or
readable text.**

### ② A README hero — **high value, portfolio**

Someone opening the repo currently sees a wall of prose. One image would carry
what 23 surfaces do.

**Spec.** 2400 × 1260, WebP or PNG, under 400 KB. `docs/hero.webp`.

This one is a **composition, not a generation** — the strongest version is real
screenshots of `/zoom`, `/network` and `/gravity` arranged on the ink background
with the wordmark. I can capture those at any resolution; say the word and I
will produce the plates for you to assemble.

### ③ Paper and film textures — **medium value**

Currently CSS gradients and canvas noise. Real scanned texture would improve the
tactile quality of the polaroids and the torn-paper edges.

| file | what | spec |
|---|---|---|
| `public/tex/grain.webp` | 35mm grain, neutral grey, tileable | 512² · under 40 KB |
| `public/tex/paper.webp` | uncoated warm paper fibre, flat lit | 1024² · under 90 KB |
| `public/tex/edge.png` | one torn paper edge, transparent background | 1200 × 120 · under 60 KB |

```
Scanned 35mm film grain, neutral grey, evenly distributed, seamless tile,
no image content, no colour cast.
```

```
Flat-lit scan of warm uncoated paper, subtle fibre and tooth, no print,
no shadow, seamless tile.
```

### ④ Social card — **optional**

[`opengraph-image.tsx`](../src/app/opengraph-image.tsx) already generates a
decent one at the edge. Only replace it if the generated version is clearly
better; otherwise this is churn.

**Spec.** 1200 × 630 exactly, PNG, under 300 KB, `public/og.png`. Text must
survive being scaled to a 400px-wide thumbnail — so at most six words.

---

## 2. Do not generate

| | why |
|---|---|
| **Faces, portraits, people** | breaks the synthetic-data position the whole project rests on |
| **Anything resembling a real campus** | Westbrook and Ardenmoor are invented; a recognisable real place implies a real cohort |
| **UI mockups of Ditto's actual app** | the research is unofficial; a fabricated screenshot of their product is exactly the line [GAP-ANALYSIS](GAP-ANALYSIS.md) refuses to cross |
| **Charts, diagrams, "AI" imagery** | every number here is computed and rendered live. A picture of a chart would be the one fake thing on the site |
| **Logos or wordmarks resembling Ditto's** | unofficial means unofficial |

---

## 3. Wiring, once files exist

Room plates are the only ones needing code. They go behind the stage at low
opacity, keyed by `scene.id`:

```tsx
// mood already drives the DOM wash in src/lib/temperature.ts —
// the plate goes underneath it, never instead of it
<div
  aria-hidden
  className="pointer-events-none absolute inset-0 opacity-[0.18]"
  style={{
    backgroundImage: `url(/rooms/${scene.id}.webp)`,
    backgroundSize: 'cover',
    filter: 'saturate(0.7)',
  }}
/>
```

Load them with `next/image` `priority={false}` and a blur placeholder, and keep
the procedural path as the fallback — the site must still work with the images
missing, because it works that way today.

---

## 4. Checklist before committing any of them

- [ ] no people, faces, or reflections of people
- [ ] no readable text, signage, or logos
- [ ] under the size budget for its row
- [ ] dark enough that white text sits on it legibly
- [ ] the page still works if the file is deleted
- [ ] `npm run check` and `npx next build` still pass
