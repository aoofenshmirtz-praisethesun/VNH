# What I need from you — priority ordered
### 12:40, 17 Aug

---

## First: the static vs React question, explained properly

That was shorthand on my part. Here's what I was actually asking.

**Two ways a web app can be put together:**

| | Static | React / Vite |
|---|---|---|
| What it is | Plain `.html`, `.css`, `.js` files | A JavaScript framework project |
| To run it | Double-click `index.html` — it opens | `npm install` (downloads ~200 MB), then `npm run dev` to start a local server |
| Build step | None | Yes — compiles source into final files |
| Offline demo | Works trivially | Works, but needs a production build first |

**Why I asked:** I can open a static file in a headless browser *here*, screenshot it, and see whether it actually works. I cannot run `npm` on your machine — the device shell has no network. So with static I'd hand you code I've watched run; with React I'd hand you code I've never seen execute.

**But your Antigravity setup changes the answer.** If Sonnet is implementing with access to your machine, it can install, run and test — so the constraint that drove my recommendation is gone.

**So: pick what your team knows.** For a single-page WebGL-heavy experience, **Vite with vanilla JS** is the lighter fit — React's component model buys you little when the screen is one canvas plus a few panels, and it adds a layer between you and the WebGL context. But if the team is fluent in React, use React; it works fine and familiarity beats theory at 2am.

**What I need from you is just the word**, so my specs use the right idioms.

---

## How my role changes now

Since Sonnet implements, I stop being the one writing files and become the one writing **specs precise enough that Sonnet doesn't have to guess.** That means from me:

- Exact data contracts and field names
- The verdict logic as portable pseudocode with **verbatim output strings**
- Exact UI copy — because the wording *is* the compliance
- Acceptance criteria per feature
- The demo script

That's more useful to you than me writing code Sonnet would rewrite anyway.

---

# 🔴 P0 — blocking. I need these to proceed properly.

| # | What | Why it blocks | Time |
|---|---|---|---|
| **1** | **Framework word: Vite-vanilla, or React** | My specs use the wrong idioms otherwise | 5 sec |
| **2** | **What has Sonnet already built?** Paste the file tree or tell me | I will otherwise spec things that exist, or miss what doesn't | 2 min |
| **3** | **Confirm the PII scrub is pushed** | Public repo, 12 named people. Only you can push | 5 min |

**Nothing else blocks F1–F5.** I already hold all the data those need.

---

# 🟠 P1 — unlocks Tier 2 features. Give me when ready.

| # | What | Unlocks | Time | Only you? |
|---|---|---|---|---|
| **4** | `outfalls.csv` — 12 outfalls with lat/lon, `confidence` column | F7 upstream-outfall lookup | 1 hr | ✅ needs judgement on "nearest channel" |
| **5** | `flood_reports.csv` — start from the NMC Monsoon Preparedness Plan's **66 low-lying areas**, then Reddit | F9 flood layer, Q2's primary | 40 min | ✅ |
| **6** | ESR supply hours — classified | F8 supply inequality | 1 hr | ⚪ I can do it if you send the PDFs; another chat is faster |

**Format matters more than completeness.** Ten confident outfalls beat twelve guesses. Include a `confidence` column and I'll render low-confidence points differently.

---

# 🟡 P2 — polish. Only if time appears.

| # | What | Unlocks |
|---|---|---|
| **7** | `esr_boundaries.geojson` — 4–6 traced polygons | F6 "where your water comes from" |
| **8** | NMC ward/zone boundaries | Fallback zone lookup |
| **9** | Which 3 localities to feature in the demo | Lets me hard-wire presets so nobody types on stage |

---

# ⚫ Yours alone — I cannot do these

Environment setup and `npm install` · `git push` · browser testing · **caching map tiles for offline** · screen-recording the 60-second fallback · rehearsing to 2:45 · charging everything · putting the build on two laptops.

---

## One engineering note on the WebGL build — not a pushback

You've decided; I'm not relitigating it. But make it **separable**:

> **Build the working app first. Add the WebGL layer as a distinct, removable layer on top — with a flag or a separate entry point that renders the plain version.**

The reason is purely practical: a shader that fails on the demo laptop's GPU, or a frame-rate collapse under a projector, takes the whole demo with it if the two are entangled. If they're separable you flip one switch and still have a working product.

Concretely: `index.html` (plain, always works) and `experience.html` (WebGL), sharing the same data and verdict modules. Sonnet can build both against one data layer.

That costs almost nothing to arrange up front and is very expensive to retrofit at 4am.

---

## Right now, in order

1. Say **"vite"** or **"react"**
2. Paste what Sonnet has built so far
3. Push the PII scrub
4. Point someone at task 4 or 5

Then I start writing the specs Sonnet builds from.
