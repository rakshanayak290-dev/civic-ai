# CivicAI — From Complaints to Action: AI for Civic Impact
**PromptWars × ASTRA Hackathon Project | Individual Working Prototype**

> *"Transform scattered citizen reports into prioritized, explainable, and trackable municipal action."*

---

## 🌟 Executive Summary

Municipalities receive hundreds of disorganized citizen complaints every week via phone calls, social media, and walk-ins. Crucial hazards (sinkholes, live fallen power lines, ruptured water mains) often languish in identical queues as non-urgent cosmetic requests. Meanwhile, identical issues are reported dozens of times, draining municipal field crew budgets with duplicate truck rolls. Citizens never hear back after reporting an issue, destroying public trust.

**CivicAI** solves this systemic failure across all **four stages of the report lifecycle**:
1. **Stage 1 — Capture**: 60-second mobile report intake with real-time pre-submission duplicate warnings, photo upload presets, and GPS locking.
2. **Stage 2 — Understand**: Server-side AI triage via Google's `gemini-3.8-flash` model and deterministic civic heuristics. Generates an executive summary, allocates target SLAs, and calculates an **explainable priority score**.
3. **Stage 3 — Reveal**: Interactive SVG GIS Map visualizing acute problem hotspots, recurring ward patterns, systemic capital repair advice, and **1-Minute Executive Action Briefs**.
4. **Stage 4 — Act**: Authenticated operations command center for municipal dispatchers with status audit trails, duplicate report consolidation, and a public tracking portal with live pipeline progression and citizen corroboration upvoting.

---

## 🚀 Live Demo & 5-Minute Judge Walkthrough

To review the entire end-to-end prototype in 5 minutes:
1. Open the application in your browser (`http://localhost:3000`).
2. Click **"5-Min Judge Tour"** in the top navigation bar or footer.
3. Follow the guided 4-step interactive walkthrough:
   - **Step 1 (Capture)**: Visit **Report Issue** to experience pre-submission duplicate detection and photo presets.
   - **Step 2 (Understand)**: Open the **AI Sandbox** to test explainable mathematical weight adjustments ($Safety \times 4.0 + Urgency \times 3.5 + Impact \times 2.5$) and real-time neural summary generation.
   - **Step 3 (Reveal)**: Open **GIS Hotspots** to inspect chronic infrastructure clusters and generate a **1-Minute Executive Action Brief**.
   - **Step 4 (Act)**: Open **Admin Command** to merge duplicate tickets and track field crew dispatch updates on the public **Track Report** page.

---

## 🔬 Core Features & Hackathon Requirements

### 1. Stage 1: Capture (< 60 Seconds)
- **Mobile-First UX**: Responsive form optimized for handheld mobile devices.
- **Location Pinning**: Automatic browser geolocation lock + landmark and municipal ward selector (Wards 1 through 7).
- **Photo Upload & Presets**: Custom file upload with built-in instant image presets (asphalt crater, sewer backup, broken streetlight fixture, live downed wire).
- **Real-Time Pre-Submission Duplicate Shield**: As the user types their report, the system executes an asynchronous distance + token overlap check against the municipal database. If a match is detected nearby, a glowing warning banner appears with the matching ticket ID and a 1-click **"Corroborate Existing Incident (+1)"** button to prevent filing a redundant report.

### 2. Stage 2: Understand (Neural AI + Explainable Scoring)
- **Real AI Engine**: Server-side proxy integrating `@google/genai` with `gemini-3.8-flash` (`ThinkingLevel.LOW` for sub-second SLA). Cleanly falls back to deterministic civic heuristics if unconfigured.
- **Executive Summarization**: Distills conversational citizen complaints into an authoritative 1-sentence dispatch summary.
- **Mathematical Explainability Formula**:
  $$\text{Composite Priority} = (\text{Safety Risk} \times 4.0) + (\text{Urgency} \times 3.5) + (\text{Public Impact} \times 2.5)$$
  - Range: $10$ to $100$.
  - Levels: **Critical** (80–100, SLA: 2–4h), **High** (60–79, SLA: 24h), **Medium** (40–59, SLA: 48h), **Low** (1–39, SLA: 120h).
  - Every score displays individual factor progress bars and plain-language legal/safety justifications.

### 3. Stage 3: Reveal (GIS Hotspot Radar & 1-Minute Action Briefs)
- **Interactive SVG Map Canvas**: Visualizes complaints across a custom street and river grid with glowing pulsating radar heat circles.
- **Centroid-Based Proximity Clustering**: Groups reports within a 400-meter radius, calculating cluster open rates, primary failure modes, and recurrence severity.
- **Systemic Capital Works Guidance**: Contrasts routine short-term patching with AI-recommended systemic overhauls (e.g. replacing an undersized stormwater culvert rather than repeatedly unclogging street drains).
- **1-Minute Executive Action Brief**: Converts unstructured citizen complaints into a structured decision brief for city managers, including:
  - 60-Second Executive Summary
  - Crew Type & Personnel Count (e.g., 5-person hydraulics team)
  - Specialized Heavy Equipment Required (e.g., hydro-vacuum truck, cold-milling machine)
  - Estimated Materials Cost
  - Municipal Tort Liability & Public Safety Risk Exposure
  - Immediate Operational Directive

### 4. Stage 4: Act (Dispatch Workflow & Citizen Public Tracking)
- **Admin Operations Command Center**: KPI summary tiles (Total, Open, Critical, Resolved, In Progress, SLA Risk), multi-attribute filter toolbar (Status, Category, Ward, Priority, Search), and duplicate review queue.
- **Work Order Status Progression**: Strict 5-stage workflow (`Submitted` → `Under Review` → `Assigned` → `In Progress` → `Resolved`). Every update requires an official dispatcher audit log note.
- **Duplicate Ticket Consolidation**: Dispatchers can merge duplicate reports into the parent incident with a single click, transferring corroboration counts and archiving the duplicate.
- **Citizen Public Tracking Portal**: Citizens retrieve their report status via unique reference ID (e.g., `CIV-2026-4819`), view field photos, corroborate ("I'm also affected"), and inspect a timestamped chronological audit trail.

---

## 📊 Pre-Loaded Synthetic Benchmark Dataset (35 Complaints)

To demonstrate clustering, duplicate detection, and municipal operations realistically without violating privacy laws, CivicAI comes pre-seeded with **35 diverse synthetic municipal complaints**:
- **5 Wards Covered**: Ward 1 (Financial & Tech Hub), Ward 2 (South Garden Hills), Ward 3 (Central District), Ward 5 (Metro West), and Ward 7 (Riverside Waterfront).
- **Deliberate Duplicate Pairs**:
  - `CIV-2026-4819` & `CIV-2026-4820` (Oak Ave Pothole — 45m distance, 95% confidence).
  - `CIV-2026-3101` & `CIV-2026-3104` (Riverside Water Main Break — 65m distance, 88% confidence).
  - `CIV-2026-6101` & `CIV-2026-6103` (Magnolia Blvd Senior Living Flooding — 32m distance, 91% confidence).
  - `CIV-2026-6107` & `CIV-2026-6109` (Garden Hills Dangling Tree Branch — 18m distance, 94% confidence).
- **Acute Hazards**: Structural asphalt crater, ruptured 12-inch water main, arcing live electrical wire, gas leak odor, submerged wheelchair ramp, and knocked-down One-Way signage.
- **Disk Persistence**: Stored in `data/complaints.json`. Changes survive server reboots and browser refreshes. Reseed anytime via the **Diagnostics Suite** or `POST /api/reset-demo`.

---

## 🛠️ Architecture & Technical Stack

```
CivicAI Platform Architecture
├── Frontend (Client-Side)
│   ├── React 19 + TypeScript + Tailwind CSS (Vibrant Cyber-Civic Theme)
│   ├── Lucide React Icons + Glassmorphism UI Components
│   ├── Interactive GIS SVG Radar Map + Motion Animations
│   └── Explainable Priority Card & 1-Minute Action Brief Modal
│
├── Backend (Server-Side)
│   ├── Node.js + Express + TypeScript (Running on port 3000 via tsx)
│   ├── Google Gemini API (@google/genai SDK with gemini-3.8-flash)
│   ├── Deterministic Civic Heuristics Engine (Fast 5.5s timeout race fallback)
│   ├── Haversine Distance & Jaccard Lexical Duplicate Engine
│   └── Centroid-Based Hotspot Clustering & Systemic Recommender
│
└── Storage & Verification
    ├── Disk-backed JSON persistence (data/complaints.json)
    └── Built-in Diagnostics Suite (8 live automated E2E assertions)
```

### Security Disclosures
- **Zero Client-Side API Keys**: Gemini API calls are strictly handled server-side through Express REST endpoints. No API credentials are ever exposed to browser JavaScript.
- **Input Validation**: All payloads are validated for mandatory fields, string length bounds, and valid enum values.
- **Audit Immutability**: All status updates, department assignments, and merges append immutable timestamped audit entries.

---

## 🧪 Automated Verification Suite

CivicAI includes an in-app **Automated Diagnostics Suite** accessible via the navigation bar. It executes 8 automated E2E integration tests against the live Express backend:
1. `API Gateway & Health Verification`
2. `Complaint Data Fetch & Schema Validation`
3. `Complaint Creation & Disk Persistence`
4. `Geospatial & Lexical Duplicate Detection`
5. `Mathematical Explainable Priority Calculation`
6. `Centroid-Based Hotspot & Cluster Aggregation`
7. `Operational Status Mutation & Audit Trail`
8. `AI Neural Triage Engine Response`

---

## ⚖️ Honesty & Technical Limitations Note
*(Required under PromptWars × ASTRA Hackathon Guidelines)*

### What is Real & Working
- Real full-stack client-server architecture running on Express port 3000.
- Real disk persistence storing complaints, status changes, and upvotes in `data/complaints.json`.
- Real Gemini 3.8 Flash API integration with structured JSON output and deterministic civic heuristics fallback.
- Real mathematical Haversine distance and semantic token overlap duplicate correlation.
- Real centroid clustering surfacing recurring infrastructure pain points.
- Real 8-assertion automated diagnostics test runner.

### What is Demo Data / Simulated
- **Citizen Records & Demo Data**: All 40 preloaded complaints are realistic synthetic municipal demo records (4 Critical, 10 High, 16 Medium, 10 Low; including deliberate duplicate pairs and two geographic clusters) labeled clearly as "Demo data".
- **Government Legacy Radio**: Dispatches are handled within CivicAI's own operations database; no direct legacy city radio CAD systems are claimed.

### AI Failure Modes & Engineering Roadmap
- **Compound Sarcasm & Sentiment**: Highly sarcastic complaints (e.g., *"I just love how the street flooded my basement again"*) can occasionally challenge automated sentiment scoring.
- **Very Dense Urban Overlaps**: Coarse smartphone GPS readings on high-density high-rise intersections may produce false-positive duplicate recommendations, which is why CivicAI mandates human dispatcher confirmation before ticket merging.
- **Next Engineering Horizons**: Photogrammetric computer vision to calculate pothole cubic volume directly from uploaded smartphone photos, two-way WhatsApp municipal bot integration, and GIS CAD shapefile export for civil engineering contractors.

---

## 📜 License
Developed for the **PromptWars × ASTRA 2026 Civic AI Hackathon**.
SPDX-License-Identifier: Apache-2.0
