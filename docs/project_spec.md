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
