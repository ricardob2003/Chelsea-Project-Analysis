# Learning Goals

This project is a vehicle for developing skills that remain valuable in an environment where AI handles routine engineering tasks. The goals below reflect what this project is designed to teach beyond the code itself.

---

## 1. Problem Framing and Domain Knowledge

**The core skill: knowing which questions are worth asking.**

Writing code is the easy part. The hard part is arriving at a question precise enough to be answerable with data, specific enough to drive a decision, and grounded enough in the domain to actually matter.

This project requires translating between two worlds:
- **Domain experts** (scouts, coaches, sporting directors) who think in terms of player profiles, tactical roles, and transfer windows
- **Technical systems** that operate on tables, metrics, and pipelines

The goal is to become fluent in both — not just as a translator, but as someone who can identify where domain knowledge should constrain a technical decision, and where data should challenge a domain assumption.

**Questions to sit with:**
- Is "U-22 recruitment" a business constraint or a football strategy? Does the distinction matter for how we model it?
- What does "maximizing Premier League outcomes" actually mean in a schema? How do you turn a club's ambition into a measurable target?
- When a scout says a player "covers ground well," what metric are they describing — and is that metric in the data?

---

## 2. Data Modeling Decisions

**The core skill: judgment about structure, not just syntax.**

Data modeling is where business logic lives. Every table, column, and relationship encodes a decision about what matters and at what resolution. These decisions compound — a wrong granularity choice early forces workarounds everywhere downstream.

Key judgment areas this project surfaces:

- **Granularity:** Match-level data captures form and variance. Season-level data captures consistency. Neither is inherently right — the question determines which you need, and often you need both joined cleanly.
- **Metric proxies:** xG is a proxy for finishing quality, not finishing itself. Progressive carries are a proxy for ball progression, not creativity. Knowing what a metric actually measures — and what business question it answers — is separate from knowing how to compute it.
- **Missing data semantics:** A player with zero defensive actions in a match may have been injured, rested, played a different role, or simply not been asked to press. The absence of data has meaning that the data itself doesn't encode. Handling this requires domain knowledge, not just SQL.

**The practice:** Before writing a query, write a sentence describing what the result should mean to a sporting director. If you can't write that sentence, the query isn't ready.

---

## 3. End-to-End System Thinking

**The core skill: understanding failure modes across the full stack.**

The pipeline in this project runs: ingestion → transformation → SQL data mart → API → frontend → presentation layer. Each handoff is a potential failure point. Understanding the system means knowing not just how each layer works, but how they fail, and what breaks downstream when they do.

Stages and what can go wrong:

| Stage | What it does | Where it can break |
|---|---|---|
| Ingestion | Pulls raw data from FBref, Transfermarkt, WhoScored | Source schema changes, rate limits, incomplete seasons |
| Transformation | Cleans, normalizes, standardizes | Silent type coercions, player name mismatches across sources |
| SQL (raw → staged → mart) | Builds the analytical data model | Wrong joins, incorrect aggregation grain, stale views |
| API | Serves data to the frontend | Missing endpoints, schema drift between DB and response models |
| Frontend | Renders KPIs and visualizations | Incorrect assumptions about null values, display rounding errors |
| Presentation | Communicates insight to a decision-maker | Right data, wrong framing — the finding doesn't drive an action |

**The goal is a self-serving system:** one where bad data is caught early, failures surface clearly, and the output is trustworthy enough that a decision-maker can act on it without digging into the pipeline themselves.

**The practice:** Break something deliberately. Corrupt an ingestion file, change a column name, drop a mart table. Trace exactly where and how the failure propagates. Fix it with a check that would catch it automatically next time.

---

## 4. Stakeholder Communication

**The core skill: closing the loop between data and decision.**

A dashboard that requires explanation has failed. A recommendation that can't be acted on has failed. The measure of this project is not whether the pipeline runs — it's whether a sporting director, with no technical background, can look at the output and know what to do next.

This is where the CS + Business combination becomes a genuine advantage. Most engineers optimize for correctness. Most business people optimize for narrative. The job here is to optimize for **decision quality** — which requires both.

**What good looks like:**
- A KPI card that shows a number, its direction, and what it means for recruitment priority — without a legend
- A position gap chart where a non-technical viewer can immediately identify which positions are most urgent to address
- A recommendation that names a role, a profile, and a reason — not just a finding

**Questions to pressure-test against:**
- If you showed the dashboard to someone who has never seen the data, what would they do next?
- Is the most important insight the most visually prominent thing on the screen?
- Can you give a one-sentence verbal summary of the current recommendation that a director would repeat to their board?

---

## Summary

| Learning Goal | What It Trains | Why It Matters |
|---|---|---|
| Problem framing | Asking the right question before building | AI generates answers — you need to own the questions |
| Data modeling | Encoding business logic in structure | Judgment about data compounds across every downstream use |
| System thinking | Understanding failure across the full stack | Owning outcomes, not just tasks |
| Stakeholder communication | Translating data into decisions | The last mile is human — that's where value is realized |
