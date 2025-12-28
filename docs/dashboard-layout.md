# NeuroPulse Dashboard Layout

The NeuroPulse dashboard is the primary user interface for EMS coordinators,
ED clinicians, and operations staff to monitor real-time stroke cases, routing,
and AI-driven recommendations.

This document describes the **first iteration** of the dashboard layout.

---

## High-Level Goals

- Provide a **real-time view** of incoming suspected stroke cases.
- Show **AI risk scores, LVO probability, and routing recommendations** clearly.
- Visualize the **timeline** from symptom onset → EMS → ED → imaging → treatment.
- Surface **hospital capacity** and capabilities to justify routing decisions.
- Present **Gemini-generated explanations and recommended actions** in a human-readable way.

---

## Main Screen Layout (Single-Page View)

The initial MVP will be a single primary screen with three main regions:

1. **Left: Active Cases Panel**
2. **Center: Selected Case Timeline & Vitals**
3. **Right: AI Insights & Hospital Map**

### 1. Active Cases Panel (Left Column)

**Purpose:** List all active EMS cases that NeuroPulse is tracking.

- Position: left vertical column.
- Content:
  - One row per **active case**.
  - Each row shows:
    - Case ID (e.g., `CASE-AB12CD34`)
    - Age / sex (if available)
    - Current **risk category** (LOW / MODERATE / HIGH / CRITICAL)
    - Compact icon for **LVO suspicion** (e.g., bolt icon if high)
    - Time since symptom onset (if known), e.g. "32 min since onset"

**Interactions:**
- Clicking a case selects it and updates the **center** and **right** panels.
- Cases are ordered by **risk category** and/or **time since onset** (most urgent first).

---

### 2. Selected Case Timeline & Vitals (Center)

**Purpose:** Provide a clear, real-time view of what is happening for the selected case.

**Subsections:**

#### 2.1. Case Header

- At the top, show:
  - Case ID, age, sex
  - EMS unit ID
  - Risk category badge (color-coded)
  - Stroke probability & LVO probability
    - e.g., "Stroke: 0.87 (HIGH)", "LVO: 0.62 (MODERATE)"

#### 2.2. Timeline View

A horizontal timeline with key events:

- Symptom onset (if known)
- Last known well
- EMS dispatch
- EMS arrival on scene
- FAST exam completed
- AI first prediction
- Arrival at hospital (future / simulated)
- CT started / completed (later step)
- tPA / EVT decision (later step)

Events are represented as **dots** or **cards** along a time axis.
The current time is shown with a vertical marker.

#### 2.3. Live Vitals Panel

- A small chart or numeric tile section showing:
  - Heart rate
  - Blood pressure (systolic / diastolic)
  - SpO₂
  - Respiratory rate
  - GCS total
- Vitals update as new `ems.vitals.raw` events arrive.
- Out-of-range values can be highlighted (e.g., red if extreme).

---

### 3. AI Insights & Hospital Map (Right)

This region combines:

1. Recommended hospital / routing details
2. Hospital capacity
3. LLM explanations and suggested actions

#### 3.1. Hospital Recommendation Card

- Show:
  - Recommended destination hospital name
  - Type (Primary / Comprehensive / Thrombectomy-capable)
  - Estimated travel time
  - Estimated additional door-to-needle minutes at that hospital
  - Comparison to **alternative hospital** (e.g., closer but more crowded)

Example:

> **Recommended: Metro Comprehensive Stroke Center**  
> Travel: 14 min · Additional D2N: ~10 min  
> vs. Valley Primary Stroke Center: 9 min travel · D2N: ~30 min  
> **Reason:** Higher LVO probability; comprehensive can perform thrombectomy.

#### 3.2. Mini Map View

- Simple map showing:
  - EMS location (approx)
  - Candidate hospitals
  - A highlighted route to the recommended one (even if static / simulated).

(Implementation can be minimal: a static map image or a simple diagram for MVP.)

#### 3.3. AI Explanation & Action Plan

- A text area showing:
  - `llm_explanation_summary` – short explanation from Gemini.
  - `llm_recommended_actions` – bullet list of action items.

Example:

> **AI Summary:**  
> High likelihood of acute ischemic stroke with possible right hemisphere involvement. Time since onset is within IV tPA and EVT windows.  
>  
> **Recommended Actions:**  
> - Route to Metro Comprehensive Stroke Center for possible thrombectomy.  
> - Pre-notify stroke team with suspected LVO.  
> - Maintain SpO₂ > 94% and avoid hypotension during transport.

---

## Secondary Views (Future Iterations)

Not required for the first MVP, but possible later:

- **Historical Cases View** – list past synthetic cases from BigQuery.
- **Performance Metrics View** – charts showing average door-to-needle times, routing decisions, etc.
- **What-if Simulation** – adjust onset time, vitals, or capacity to see how recommendations change.

---

## MVP Scope for the Hackathon

For the hackathon demo, the following are **in scope** for the dashboard:

- Active cases list (left)
- Selected case header with risk & probabilities
- Simple timeline with at least:
  - Symptom onset (simulated)
  - FAST exam
  - AI prediction
- Numeric vitals display (no need for fancy charts initially)
- Hospital recommendation card
- Text-based capacity summary for recommended and alternative hospitals
- AI explanation and action plan text

A fully interactive map is **nice-to-have**; a simplified visualization is acceptable for MVP.

