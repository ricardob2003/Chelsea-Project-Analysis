# Chelsea Recruitment Strategy Analytics Engine

---

## 1. Project Definition

### 1.1 Project Question + Purpose

#### Primary Question

Where should Chelsea focus recruitment (U-22 strategy) to maximize **Premier League** outcomes:

1. Consistent **UCL qualification (Top 4)**
2. Realistic **title contention (Top 2 / defined points threshold)**

#### Purpose

Build a structured decision-support system that transforms match, squad, and league performance data into:

- Recruitment priorities by position/role
- Evidence-based performance gap diagnostics
- Strategic recommendations grounded in measurable KPIs

This system replaces narrative-driven analysis with reproducible, data-backed evaluation of Chelsea’s recruitment strategy.

---

### 1.2 Decision Constraints

#### Competition Scope

- Analysis limited strictly to the **Premier League**
- European competitions excluded for consistency

#### Strategic Constraint

- Recruitment focus on **U-22 profiles** (policy implemented circa 2023)
- Emphasis on development trajectory and long-term squad value

#### Outcome Targets

- Minimum: Top 4 finish (UCL qualification)
- Stretch: Title contention (Top 2 or benchmark points threshold)

#### Operational Constraints

- Budget allocation buckets (Low / Medium / High)
- Squad registration limits (optional inclusion)
- Risk tolerance:
    - Injury history
    - Adaptation risk
    - Immediate minutes pathway feasibility

---

## 2. Analytical Domains & Required Data

Data requirements are structured by domain to align directly with star schema modeling and pipeline stages.

---

### A) Results & League Context (Team / Season / Match Grain)

Purpose: Evaluate macro performance and benchmarking.

Required Data:

- Match results (W/D/L)
- Goals scored / conceded
- Points earned
- Goal differential
- Home vs away splits
- Opponent strength proxy (league position or rolling form)
- xG/xGA (if available)

---

### B) Squad Usage & Structure

Purpose: Evaluate squad depth, youth integration, and structural gaps.

Required Data:

- Minutes played per player
- Minutes by position group
- U-22 minutes share
- Squad age distribution
- Continuity metrics (returning vs new minutes)
- Injury history (optional)

---

### C) On-Pitch Performance & Positional Gaps

Purpose: Identify structural weaknesses.

Required Data:

- Team-level attacking and defensive output
- Benchmark comparisons vs Top 4 teams
- Venue splits
- Monthly underperformance patterns
- Phase-based performance trends

---

### D) Recruitment & Market Inputs

Purpose: Constrain recommendations to realistic U-22 targets.

Required Data:

- Player age
- Position
- Minutes played
- Performance indicators
- Market value proxy (optional)
- Contract duration (optional)

---

## 3. Deliverables

### Deliverable 1: Executive Brief

Format: PDF

Includes:

- Diagnosis → Guiding Policy → Coherent Actions
- 3–5 prioritized recruitment recommendations
- Impact vs feasibility evaluation

---

### Deliverable 2: Dashboards

Primary Visualization Layer

Core Pages:

1. **Chelsea vs Benchmark**
2. **Pitch Weakness Map**
3. **Recruitment Priority Board**
4. **U-22 Fit Filter**

Dashboards will connect exclusively to SQL views in the mart schema.

---

### Deliverable 3: Data Engineering Evidence (GitHub Repository)

- Layered architecture (raw → staged → mart → views)
- Star schema documentation
- Reproducible Docker environment
- Data quality checks
- Pipeline run logging

---

## 4. Dashboard Pillars

The dashboard is structured around four sequential pillars, reflecting the order
in which analysis must be understood before recruitment decisions can be made.

---

### Pillar 1 — Sporting Performance ✓ (in progress)

*How is this Chelsea team performing vs previous Chelsea sides and vs the rest of the league?*

**Status:** Core metrics built. Remaining work: data pipeline stabilisation.

**What's built:**
- Historical league finishes table (position, pts, W/D/L, GF/GA, GD, vs champion, vs UCL)
- Season comparison bar chart (points by season, coloured by finish tier)
- Cumulative points race chart (Chelsea vs top 6 by matchday)
- xG tracker (cumulative goals vs xG, luck gap)
- KPI cards: position, points, xGD, vs UCL cutoff, PPM, GD
- Form stats row: clean sheet rate, unbeaten run, xG luck gap, home/away PPM splits
- Monthly form chart: points and GD by calendar month

**Deferred (no data source yet):**
- U-22 minutes share, avg age by position group (requires roster DOB data)
- Defender/GK specialist metrics (tackles, saves — not in current sources)

---

### Pillar 2 — Financial Performance (Transfer Market)

*What has Chelsea spent, on whom, at what age, and did it deliver?*

**Status:** Not started. Data source not yet ingested.

**Planned metrics:**
- Gross spend, net spend per season vs comparator clubs (Arsenal, Liverpool, Man City, Newcastle)
- Spend by position group
- Average age of signings (U22 policy in practice)
- Fee paid per 90 minutes delivered (ROI per signing)
- Origin clubs — where is Chelsea buying from/selling to?

**Data source:** Transfermarkt (via `soccerdata` Transfermarkt reader)

**Comparator window:** 2022-23 (Boehly takeover) → present

---

### Pillar 3 — Current Squad Metrics

*Who is in the squad, are they performing, and where are the structural gaps?*

**Status:** Partial. Player minutes/per90 built. Age and depth gaps deferred.

**What's built:**
- Squad table: player minutes, availability rate, G+A/90, xG/90, xA/90, sample confidence
- Position gap chart: Chelsea per90 vs top-4 cohort by position group

**Planned additions:**
- Player age at season start (requires roster data with DOB)
- U-22 share of minutes
- Depth count by position group vs top-4 benchmark
- Contract expiry context (requires external data)

---

### Pillar 4 — Financial Performance v2 (Club Accounting)

*What are Chelsea's actual recorded losses, PSR position, and financial health?*

**Status:** Not started. Requires manual data curation from annual reports.

**Planned metrics:**
- Annual revenue, wages, operating loss, net loss (per season)
- Transfer fee amortisation burden
- PSR headroom estimate
- Comparison vs Arsenal, Liverpool, Man City, Newcastle

**Data source:** Static dataset manually curated from Companies House filings
and published annual reports. Updated once per year when filings are released.

**Key concept:** Transfer fees are amortised over contract length on the P&L
(e.g. £100m player on 5yr deal = £20m/yr charge, not £100m upfront). This is
the primary driver of Chelsea's recorded losses and must be understood before
any recruitment ROI analysis.
