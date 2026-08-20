# Ditto Kinetic

Teardown of the Ditto dating app (`app.ditto.ai`, `tryditto.com`), reconstructed from
screenshots of the live signup flow captured 2026-08-19, as the basis for a rebuild.

## Docs

| File | What's in it |
|---|---|
| [docs/TEARDOWN.md](docs/TEARDOWN.md) | How the app is built — shell, state machine, chat framing, visual system, widget inventory, third-party surface, privacy posture, growth loop |
| [docs/ONBOARDING-FLOW.md](docs/ONBOARDING-FLOW.md) | All 24 onboarding steps verbatim: prompt copy, widget, option lists, validation, plus a proposed data model |
| [docs/COMPANY-RESEARCH.md](docs/COMPANY-RESEARCH.md) | Ditto the company — founders, funding, traction, how the founders describe the product, and the three open problems worth aiming at |
| [docs/REFERENCES.md](docs/REFERENCES.md) | Build references — kage (three.js scroll-camera technique) and its licensing constraint |
| [reference/](reference) | The 27 source screenshots the teardown is built from |

## The one-paragraph version

Ditto is a college dating app with **no swipe deck**. You answer ~24 questions framed
as a chat with an AI concierge named Ditto, then wait — matches arrive in batches on a
"drop day" rather than through a feed. The entire signup lives at a single URL as a
client-side state machine. Phone number is the only credential; there is no password.
Sensitive fields (ethnicity, age, politics, religion) carry per-field privacy microcopy
at the point of entry. Right before the payoff, at peak sunk cost, it shows you a
computed personal match probability and offers a guaranteed match for one referral.

## Status

Documentation only. No implementation yet.

Next: scaffold the onboarding state machine and the eleven input widgets listed in
[the widget inventory](docs/TEARDOWN.md#25-input-widget-inventory).

## Note on scope

This is an analysis of a competitor's public signup flow for design and architecture
reference. Copy, photography, and brand marks belong to Ditto and are quoted here only
to document the flow — none of it should ship in a derived product.
