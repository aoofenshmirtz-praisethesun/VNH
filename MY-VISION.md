# My vision for the project
### Put beside yours, so we can pick or merge

---

## Where I agree with you completely

**One surface. The map is the app.** Not pages you navigate between — a single basin map where everything happens as layers and filters on that one canvas. That's right for the reference aesthetic, and it's right for a 3-minute demo where every page transition costs seconds you don't have.

**Tiers as modes, not sections.** Tier 1 is always on; Tier 2 runs on demand; Tier 3 is the loop back from people.

---

## The idea I'd add — the thing that makes it one product instead of three

> **Everything is an answer about one selected place.**

You point at somewhere on the basin. That location becomes the state of the entire interface. Then your three questions are not three features — they're **three lenses on the same point**:

| Tier | The question about *this place* | Time |
|---|---|---|
| **1** | What is actually **known** here? | now |
| **2** | What would **happen** here — if it rains, if I plant this crop, if that outfall were intercepted? | conditional |
| **3** | What is being **done** here, and what do you know that we don't? | ongoing |

**One place, three tenses: known, would-be, being-done.**

That framing means there is no navigation to design, no menu structure to argue about, and no feature that feels bolted on. Everything is "…about here."

---

## The signature interaction — the thing nobody else will have

> **Zoom in and the map gets emptier.**

Every map ever made gets richer as you zoom. Ours inverts:

- **Basin view** — 395 marks, looks reasonably populated
- **City view** — most of them fall outside; the city thins out
- **Locality view** — almost certainly nothing at all

**That inversion is the entire argument, rendered as an interaction rather than said as a sentence.** A judge doesn't need it explained — they feel it in their hand as they zoom.

Paired with it: **the confidence horizon.** When a location is selected, draw a ring from that point out to the nearest actual measurement. You *see* how far knowledge is from you. At 40 km, that ring is enormous and absurd, and it makes the point better than any copy could.

That's cheap to build — one circle, one distance — and it's the strongest single visual in the whole concept.

---

## The emptiness is designed, not an error

When someone clicks a place with no data, the response is not a shrug or a blank state. It's composed, deliberate and slightly weighty:

> **No measurement exists here.**
> *Nearest: 40.9 km away, sampled 2019–20.*
> *That tells you about somewhere else.*

Same typography, same care as a real result. **A refusal, presented as confidently as an answer.** That's the emotional core of the product and it's the thing most teams would treat as an edge case.

---

## Honesty rendered, not stated

The interface should be **structurally incapable** of saying what we can't support. Not "we chose not to say safe" — there is no code path that produces it, no green in the palette, no tick icon, no fourth verdict state.

When a judge asks *"how do we know you're not overclaiming?"*, the answer is **"the system can't."** That's stronger than a promise.

---

## Backend — the honest answer, since you said you don't know

**For this demo there is no backend, and that's a design decision, not a gap.**

- All data is **static JSON**, loaded once (the whole dataset is under 1 MB)
- Every computation — verdict, distance, crop yield loss, upstream outfalls, flood ranking — is **arithmetic in the browser**. None of it is heavy
- The simulations in Tier 2 are lookups and formulae, not solvers
- Tier 3 (reports, readings, feedback) uses **localStorage** for the demo, with an obvious upgrade path to a tiny API later

**Consequences that are all in your favour:** it runs with the network unplugged · it deploys to GitHub Pages for free · there's nothing to fail at 3am · and when a judge asks about running costs the answer is "almost nothing."

If Tier 3 needs to persist across devices later, that's one small service. **But nothing about tonight requires it.**

---

## What I'd fight for if we disagree

Three things, in priority order:

**1. The distance must be a headline, everywhere.** Not a footnote, not a tooltip. It's the whole thesis and it must be unmissable on every answer.

**2. No page navigation in the demo path.** Five clicks, one surface. Every transition is a second of your three minutes and a chance for something to break on stage.

**3. Keep the plain version alive.** Build the WebGL experience, absolutely — but `index.html` stays working, sharing the same data and the same verdict logic. Not as a hedge against the ambition, as insurance against one specific GPU on one specific laptop at noon tomorrow.

---

## The one sentence

> **A map of a river basin that is honest about how little of it anyone has ever measured — where you point at a place and ask what is known, what would happen, and what is being done.**
