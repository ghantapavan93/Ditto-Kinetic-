# Build references

Things we're borrowing technique from. Studied, not copied — see the licensing note
on each.

---

## kage — MengTo

- Repo: <https://github.com/MengTo/kage>
- Live: <https://mengto.github.io/kage/>

A single-page scroll-driven WebGL piece: a five-chapter night walk through a fictional
Kyoto mountain temple. Our reference for how to do three.js on a marketing/pitch page
without it turning into a slow gimmick.

### Method worth stealing

| Technique | Detail |
|---|---|
| **No build step** | One `index.html`, vendored `three.min.js` (r149). Deploys to any static host, including GitHub Pages. |
| **Everything procedural** | Temple, torii, stairs, lanterns, moon, terrain, trees, fog, rain, drifting leaves, embers — all generated at runtime. No `.glb`/`.obj` anywhere. |
| **Scroll drives the camera** | Page scroll position maps to a position along a fixed camera path. Eased interpolation, subtle parallax, slow section transitions. |
| **Hybrid compositing** | Pre-generated WebP scene plates and alpha-preserving foreground cutouts are layered *over* the live WebGL, with per-section fade and blur. Depth comes from compositing, not from rendering everything in realtime. This is the performance trick. |
| **Restrained bloom** | Selective post-processing. The brief explicitly forbids "excessive glow." |
| **Accessibility built in** | Semantic landmarks, accessible labels, `prefers-reduced-motion` path, responsive mobile layout. |
| **Assets local and relative** | No remote fonts, no CDNs, no analytics — so it can't break in someone else's network. |

### Design discipline worth stealing

From the project's `PROMPT.md`, which is effectively the brief that generated it:

- **Tight palette, stated up front.** Near-black, blue-charcoal, warm amber, bone
  white, vermilion. Five values, no more.
- **Typographic contrast as the layout engine.** Oversized left-aligned English
  headings against large vertical Japanese display type, with small technical labels
  as counterweight. Generous whitespace.
- **Reveal granularity.** Headings animate in *word by word*; supporting elements
  animate individually, not as blocks.
- **A stated ban list.** No frameworks, no remote fonts, no analytics, no excessive
  glow, and — the useful one — *no decorative motion without narrative purpose.*

That last rule is the one that separates this from every other WebGL landing page.
Every motion has to be carrying a story beat or it gets cut.

### Licensing

**The Kage code and artwork carry no reuse license.** Only the bundled Three.js keeps
its MIT license.

So: we reimplement the technique, we do not copy the source files or the generated
Kyoto art. We use three.js directly (MIT, free to use). Practically this costs nothing
— the value here is the method, and any Ditto piece needs its own art regardless.

---

## three.js

- <https://threejs.org> — MIT licensed, free to vendor and ship.
- Kage pins r149. Check whether we want current or a pinned older build for the same
  no-build-step simplicity.
