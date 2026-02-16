# Risk Storming & Testability Analysis: agentic-qe.dev

**Date**: 2026-02-16
**Analyst**: QE Risk Assessor (V3)
**Scope**: 26 pages across agentic-qe.dev
**Overall Site Risk Score**: 0.61 (MEDIUM-HIGH)

---

## Table of Contents

1. [Site Inventory & Page Groups](#1-site-inventory--page-groups)
2. [Risk Storming Analysis](#2-risk-storming-analysis)
3. [Top 10 Risks](#3-top-10-risks-across-entire-site)
4. [Risk Heat Map](#4-risk-heat-map)
5. [Testability Analysis](#5-testability-analysis)
6. [Prioritized Test Strategy](#6-prioritized-test-strategy)
7. [Mitigation Recommendations](#7-mitigation-recommendations)

---

## 1. Site Inventory & Page Groups

### Group A: Main Pages (10 pages)

| # | Path | Status | Load Time | Elements | Word Count |
|---|------|--------|-----------|----------|------------|
| 1 | `/` (Home) | 200 | 829ms | 582 | 385 |
| 2 | `/framework` | 200 | 571ms | 916 | 1269 |
| 3 | `/agents` | 200 | 608ms | 1912 | 2313 |
| 4 | `/playbook` | 200 | 548ms | 875 | 1541 |
| 5 | `/contributors` | 200 | 544ms | 283 | 565 |
| 6 | `/assessment` | 200 | 553ms | 148 | 105 |
| 7 | `/integrations` | 200 | 548ms | 351 | 393 |
| 8 | `/migration` | 200 | 541ms | 494 | 503 |
| 9 | `/docs` | 200 (shows 404) | 568ms | 58 | N/A |
| 10 | `/skills` | 200 | ~560ms | ~1800 | ~2200 |

### Group B: Playbook Subpages (16 pages)

| # | Path | Type |
|---|------|------|
| 1 | `/playbook/getting-started` | Guide |
| 2 | `/playbook/assessment-guide` | Guide |
| 3 | `/playbook/implementation-patterns` | Guide |
| 4 | `/playbook/agent-design-patterns` | Reference |
| 5 | `/playbook/orchestration-strategies` | Reference |
| 6 | `/playbook/human-in-the-loop` | Reference |
| 7 | `/playbook/v3-workflows` | Technical |
| 8 | `/playbook/domain-driven-qe` | Technical |
| 9 | `/playbook/model-routing` | Technical |
| 10 | `/playbook/queen-orchestration` | Technical |
| 11 | `/playbook/learning` | Technical |
| 12 | `/playbook/browser-automation` | Technical |
| 13 | `/playbook/fleet-configuration` | Technical |
| 14 | `/playbook/migration` | Guide |
| 15 | `/playbook/use-cases` | Reference |
| 16 | `/playbook/tools-templates` | Reference |

### Group C: Interactive Pages

| Page | Interactive Elements | Complexity |
|------|---------------------|------------|
| `/assessment` | Radio buttons, Next/Previous navigation, 8-question wizard, score calculation | HIGH |
| `/` (Home) | Contact form (name, email, message), animated counters | MEDIUM |
| `/agents` | Domain filter tabs (13 categories), search input | MEDIUM |
| `/skills` | Category filter tabs, skill expansion | MEDIUM |

---

## 2. Risk Storming Analysis

### 2.1 Risk Categories & Scoring

Risks are scored as **Likelihood (L) x Impact (I)**, each on a 1-5 scale.
- **Risk Score** = L x I (max 25)
- **Critical**: 20-25 | **High**: 15-19 | **Medium**: 8-14 | **Low**: 1-7

### 2.2 Risks by Page Group

#### Group A: Main Pages

| ID | Risk | Category | Page(s) | L | I | Score |
|----|------|----------|---------|---|---|-------|
| A1 | `/docs` returns 200 with 404 content - incorrect HTTP status code misleads crawlers and users | Functional | `/docs` | 5 | 4 | **20** |
| A2 | All 26 pages share identical meta description and og:title - severe SEO duplication, no page-specific metadata | Content | All | 5 | 4 | **20** |
| A3 | No `<main>` landmark on any page - screen reader users cannot skip to main content | Usability | All | 5 | 3 | **15** |
| A4 | No skip-link on any page - keyboard users must tab through full navigation on every page | Usability | All | 5 | 3 | **15** |
| A5 | No canonical URLs on any page - risk of duplicate content penalties from search engines | Content | All | 5 | 3 | **15** |
| A6 | No structured data (JSON-LD) on any page - reduced search visibility and no rich snippets | Content | All | 5 | 2 | **10** |
| A7 | Contact form on `/` uses GET method and submits to same page - data exposed in URL, no backend processing evident | Security | `/` | 4 | 4 | **16** |
| A8 | `/agents` page has 1912 DOM elements with 60 agent cards - performance risk on low-end devices | Performance | `/agents` | 4 | 3 | **12** |
| A9 | OG image uses SVG format (`/og-image.svg`) - many social platforms do not render SVG previews | Content | All | 4 | 3 | **12** |
| A10 | Heading hierarchy violations: H1 jumps to H3 (skipping H2) on home page and agents page | Usability | `/`, `/agents` | 4 | 2 | **8** |

#### Group B: Playbook Subpages

| ID | Risk | Category | Page(s) | L | I | Score |
|----|------|----------|---------|---|---|-------|
| B1 | 13 inputs without labels on `/playbook` page - critical accessibility violation for form controls | Usability | `/playbook` | 5 | 4 | **20** |
| B2 | Playbook navigation sidebar has no ARIA landmarks or roles for section grouping | Usability | All playbook | 4 | 3 | **12** |
| B3 | Implementation Patterns page marked "Soon" - dead-end user journey, no content behind link | Functional | `/playbook/implementation-patterns` | 4 | 3 | **12** |
| B4 | Code blocks in playbook pages have no copy-to-clipboard functionality - poor developer UX | Usability | Multiple playbook | 3 | 2 | **6** |
| B5 | Playbook left nav changes between pages (some show expanded, some collapsed) - inconsistent state | Usability | All playbook | 3 | 2 | **6** |

#### Group C: Interactive Pages

| ID | Risk | Category | Page(s) | L | I | Score |
|----|------|----------|---------|---|---|-------|
| C1 | Assessment tool: 5 buttons without accessible labels - screen reader users cannot interact with radio options | Usability | `/assessment` | 5 | 4 | **20** |
| C2 | Assessment wizard state is client-side only - browser refresh loses all progress through 8 questions | Functional | `/assessment` | 4 | 4 | **16** |
| C3 | Assessment results/score calculation not visible in initial HTML - relies entirely on JavaScript rendering | Functional | `/assessment` | 4 | 3 | **12** |
| C4 | Agent filter/search on `/agents` has 1 input without label - accessibility violation | Usability | `/agents` | 4 | 3 | **12** |
| C5 | No loading states or error handling visible for assessment submission | Functional | `/assessment` | 3 | 3 | **9** |
| C6 | Animated counters on home page (60 agents, 71 skills, 13 domains) - no fallback for reduced motion preference | Compatibility | `/` | 3 | 2 | **6** |

---

## 3. Top 10 Risks Across Entire Site

| Rank | ID | Risk Description | Category | Score | Priority |
|------|-----|-----------------|----------|-------|----------|
| **1** | A1 | `/docs` returns HTTP 200 with 404 body content | Functional | **20** | P0 |
| **2** | A2 | Identical meta description/og:title on all 26 pages | Content | **20** | P0 |
| **3** | B1 | 13 inputs without labels on playbook page | Usability | **20** | P0 |
| **4** | C1 | Assessment radio buttons lack accessible labels (5 unlabeled buttons) | Usability | **20** | P0 |
| **5** | A7 | Contact form uses GET method, no CSRF protection, data in URL | Security | **16** | P1 |
| **6** | C2 | Assessment wizard loses state on refresh (no persistence) | Functional | **16** | P1 |
| **7** | A3 | No `<main>` landmark on any of the 26 pages | Usability | **15** | P1 |
| **8** | A4 | No skip-link for keyboard navigation on any page | Usability | **15** | P1 |
| **9** | A5 | No canonical URLs on any page (SEO duplicate risk) | Content | **15** | P1 |
| **10** | A8 | `/agents` page: 1912 DOM elements, performance degradation risk | Performance | **12** | P2 |

---

## 4. Risk Heat Map

### 4.1 By Page (Risk Density)

```
RISK HEAT MAP - Pages by Aggregate Risk Score
======================================================================

PAGE                          RISK SCORE    HEAT LEVEL
----------------------------------------------------------------------
/assessment                   |==========|  57  CRITICAL  [||||||||||||]
/ (Home)                      |========  |  49  HIGH      [||||||||||  ]
/agents                       |=======   |  40  HIGH      [||||||||    ]
/playbook                     |=======   |  38  HIGH      [||||||||    ]
/docs                         |=====     |  30  MEDIUM    [||||||      ]
/framework                    |====      |  25  MEDIUM    [|||||       ]
/skills                       |====      |  25  MEDIUM    [|||||       ]
/integrations                 |===       |  22  MEDIUM    [||||        ]
/migration                    |===       |  22  MEDIUM    [||||        ]
/contributors                 |===       |  20  MEDIUM    [||||        ]
/playbook/* (16 subpages avg) |====      |  26  MEDIUM    [|||||       ]
```

### 4.2 By Risk Category (Site-Wide)

```
CATEGORY              TOTAL RISK  AFFECTED PAGES  AVG RISK/PAGE
================================================================
Usability (A11y)      |==========|  131    26/26     5.04  CRITICAL
Content (SEO)         |========  |   57    26/26     2.19  HIGH
Functional            |=======   |   77     5/26     15.4  HIGH
Security              |===       |   16     1/26     16.0  HIGH (concentrated)
Performance           |===       |   18     3/26     6.0   MEDIUM
Compatibility         |==        |    6     1/26     6.0   LOW
```

### 4.3 By Risk Category x Impact Matrix

```
                    IMPACT
                    1-Minimal  2-Minor  3-Moderate  4-Major  5-Critical
L   5-Certain      |          |        | A3,A4,A5  | A1,A2  |
I                   |          |        |           | B1,C1  |
K   4-Likely       |          |        | A8,A9,B2  | A7,C2  |
E                   |          |        | B3,C3,C4  |        |
L   3-Possible     |          | B4,B5  | C5        |        |
I                   |          | C6     |           |        |
H   2-Unlikely     |          |        |           |        |
O                   |          |        |           |        |
O   1-Rare         |          |        |           |        |
D
```

---

## 5. Testability Analysis

### 5.1 Testability Dimensions (1-5 scale, 5 = most testable)

#### Home Page (`/`)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **Controllability** | 3 | Contact form inputs are controllable; animated counters harder to control timing; PACT carousel has auto-rotation |
| **Observability** | 4 | Static content easily verifiable; counter final values observable; form submission result unclear (GET to same page) |
| **Isolability** | 4 | Sections are visually distinct; header/footer shared components can be tested independently |
| **Simplicity** | 4 | Mostly static content with few interactive elements; form is simple 3-field |
| **Stability** | 4 | Content-focused page, changes infrequently; statistics may update with new releases |
| **Info Availability** | 3 | No formal spec; raw analysis JSON provides structural baseline; no design system docs |
| **Overall** | **3.7** | Good testability; contact form backend behavior is the main unknown |

#### Framework Page (`/framework`)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **Controllability** | 4 | Purely static content; no interactive controls to manipulate |
| **Observability** | 5 | All content visible in DOM; performance metrics table verifiable; architecture diagrams in HTML |
| **Isolability** | 4 | Sections independently addressable via headings; shared nav/footer |
| **Simplicity** | 3 | Dense page (916 elements, 1269 words); complex nested heading structure; TinyDancer visualization |
| **Stability** | 3 | Version-dependent content (V3 metrics) will change with releases |
| **Info Availability** | 4 | Architecture well-documented on page itself; comparison tables provide expected values |
| **Overall** | **3.8** | High testability for content verification |

#### Agents Page (`/agents`)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **Controllability** | 3 | Filter tabs controllable; search input controllable; but 60 agent cards create large state space |
| **Observability** | 3 | Filter results observable; but with 1912 elements, verifying correct filter behavior requires counting visible cards |
| **Isolability** | 2 | Filtering affects all 60 cards simultaneously; cannot test individual card rendering without full page context |
| **Simplicity** | 2 | Most complex page on site; 60 agent cards, 13 filter categories, search functionality, anchor links |
| **Stability** | 2 | Agent count actively growing (60 now); new agents added regularly changes expected values |
| **Info Availability** | 3 | Agent names/descriptions documented; filter category mapping implicit from data |
| **Overall** | **2.5** | Moderate testability; complexity is the main challenge |

#### Assessment Page (`/assessment`)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **Controllability** | 4 | Radio buttons and Next/Previous buttons are standard controls; 8-question wizard is linear flow |
| **Observability** | 2 | Score calculation logic is opaque (client-side JS); intermediate state changes not clearly observable; results page unseen in initial scrape |
| **Isolability** | 2 | Questions are sequential with dependencies; cannot test question 5 without answering 1-4; score depends on all answers |
| **Simplicity** | 3 | 8 questions x 5 options = 40 individual choices; but only 5^8 = 390,625 possible answer combinations |
| **Stability** | 3 | Questions may change; scoring algorithm may be updated |
| **Info Availability** | 1 | No specification for scoring algorithm; expected results per answer combination undocumented; no test oracle |
| **Overall** | **2.5** | Low-moderate testability; scoring logic is a black box |

#### Playbook Hub (`/playbook`)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **Controllability** | 4 | Navigation sidebar and internal links are standard; code blocks are static |
| **Observability** | 4 | Content presence verifiable; sidebar navigation state observable; code block content readable |
| **Isolability** | 3 | Left sidebar is shared across all subpages; content area independent per page |
| **Simplicity** | 3 | 16 subpages with consistent template; but 13 unlabeled inputs detected |
| **Stability** | 3 | Active content development; "Implementation Patterns" marked as "Soon" |
| **Info Availability** | 3 | Structure documented in sidebar; subpage list known from navigation |
| **Overall** | **3.3** | Moderate testability; template consistency helps |

#### Integrations Page (`/integrations`)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **Controllability** | 4 | Purely informational; code examples are static display |
| **Observability** | 5 | Architecture diagram, MCP server stats, code examples all in DOM |
| **Isolability** | 4 | Sections clearly delineated (Claude Flow, Agentic Flow, Browser Automation) |
| **Simplicity** | 4 | 351 elements; straightforward content layout |
| **Stability** | 3 | Integration details may change with platform updates |
| **Info Availability** | 4 | MCP stats provide concrete verifiable values (25+ tools, 0.6ms P95, etc.) |
| **Overall** | **4.0** | High testability |

#### Migration Page (`/migration`)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **Controllability** | 4 | Static content; command examples are display-only |
| **Observability** | 5 | Tables with V2-to-V3 mappings provide clear expected values; deprecation timeline explicit |
| **Isolability** | 4 | Sections independent (CLI mapping, agent names, rollback) |
| **Simplicity** | 4 | Well-structured reference page; 494 elements is manageable |
| **Stability** | 3 | Will update as V3 matures and V4 approaches |
| **Info Availability** | 5 | Deprecation timeline, command mappings, agent name mappings all explicitly documented |
| **Overall** | **4.2** | Highest testability on the site |

#### `/docs` Page

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **Controllability** | 5 | Just a "Return to Home" link |
| **Observability** | 5 | 404 content clearly visible |
| **Isolability** | 5 | No dependencies |
| **Simplicity** | 5 | 58 elements total |
| **Stability** | 1 | This is a bug - should either redirect or serve real content; will change |
| **Info Availability** | 1 | No spec for what this page should contain |
| **Overall** | **3.7** | Easy to test the current state; unknown what correct state should be |

### 5.2 Testability Summary Matrix

```
TESTABILITY MATRIX - All Page Groups
=====================================================================

                  Control  Observe  Isolate  Simple  Stable  Info   TOTAL
---------------------------------------------------------------------
/ (Home)          3        4        4        4       4       3      3.7
/framework        4        5        4        3       3       4      3.8
/agents           3        3        2        2       2       3      2.5
/playbook         4        4        3        3       3       3      3.3
/assessment       4        2        2        3       3       1      2.5
/contributors     4        5        4        4       4       4      4.2
/integrations     4        5        4        4       3       4      4.0
/migration        4        5        4        4       3       5      4.2
/docs             5        5        5        5       1       1      3.7
/skills           3        3        2        2       2       3      2.5
Playbook sub-avg  4        4        3        3       3       3      3.3
---------------------------------------------------------------------
SITE AVERAGE      3.8      4.1      3.4      3.4     2.8     3.1    3.4
```

### 5.3 Testability Risks

| Rank | Testability Gap | Affected Pages | Impact |
|------|----------------|----------------|--------|
| 1 | **No test oracle for assessment scoring** - Cannot verify correctness of PACT maturity score without specification | `/assessment` | Cannot validate core conversion feature |
| 2 | **Large DOM complexity on agents/skills** - 1900+ elements make automated assertions fragile and slow | `/agents`, `/skills` | Flaky tests, slow execution |
| 3 | **Unstable agent/skill counts** - "60 agents" and "71 skills" are actively changing values | `/`, `/framework`, `/agents`, `/skills` | Tests with hardcoded values will break frequently |
| 4 | **Client-side state management opaque** - Assessment wizard, agent filters have no URL state reflection | `/assessment`, `/agents` | Cannot deep-link to specific states for testing |
| 5 | **No API/backend contract** - Contact form, assessment tool have no documented backend behavior | `/`, `/assessment` | Cannot do integration testing |

---

## 6. Prioritized Test Strategy

### Phase 1: Critical Path (Week 1) - Address P0 Risks

**Focus**: Functional correctness and critical accessibility

| Test Type | Scope | Tool | Priority |
|-----------|-------|------|----------|
| **Smoke test** | All 26 pages return correct HTTP status codes | Playwright / curl | P0 |
| **404 validation** | `/docs` must return HTTP 404, not 200 | Playwright | P0 |
| **Accessibility audit** | All pages: WCAG 2.1 AA automated scan | axe-core / Playwright | P0 |
| **Label audit** | Verify all inputs, buttons have accessible names | axe-core | P0 |
| **Landmark audit** | Verify `<main>`, skip-link, heading hierarchy | axe-core | P0 |
| **Assessment flow** | Complete 8-question wizard end-to-end, verify score renders | Playwright | P0 |

**Test Count**: ~45 test cases
**Estimated Effort**: 2-3 days

### Phase 2: Content & SEO (Week 2)

**Focus**: Metadata, SEO, content accuracy

| Test Type | Scope | Tool | Priority |
|-----------|-------|------|----------|
| **Meta uniqueness** | Each page has unique title, description, og:title, og:description | Playwright | P1 |
| **Canonical URLs** | Each page has `<link rel="canonical">` | Playwright | P1 |
| **OG image validation** | Verify social preview image renders (SVG compatibility) | Manual + validator | P1 |
| **Structured data** | Verify JSON-LD presence for Organization, WebSite schemas | Lighthouse | P1 |
| **Content accuracy** | Agent count (60), skill count (71), domain count (13) match actual catalog | Playwright | P1 |
| **Link validation** | All internal links resolve to 200; all external links valid | linkinator / Playwright | P1 |
| **Navigation consistency** | Nav hash and footer hash identical across pages | Playwright | P1 |

**Test Count**: ~80 test cases
**Estimated Effort**: 3-4 days

### Phase 3: Interactive Features (Week 3)

**Focus**: Assessment tool, filters, forms

| Test Type | Scope | Tool | Priority |
|-----------|-------|------|----------|
| **Assessment wizard** | All 8 questions navigable; all 5 options per question selectable | Playwright | P1 |
| **Assessment scoring** | Boundary testing: all-lowest, all-highest, mixed answers produce valid scores | Playwright | P1 |
| **Assessment state** | Verify back navigation preserves selections; refresh behavior documented | Playwright | P1 |
| **Agent filtering** | Each of 13 domain tabs filters correctly; count matches displayed badge | Playwright | P2 |
| **Agent search** | Search by agent name returns correct results; empty search shows all | Playwright | P2 |
| **Contact form** | Valid submission; required field validation; email format validation | Playwright | P1 |
| **Contact form security** | Verify form method is POST (currently GET - this is a defect) | Playwright | P1 |

**Test Count**: ~65 test cases
**Estimated Effort**: 4-5 days

### Phase 4: Cross-Browser & Responsive (Week 4)

**Focus**: Compatibility, responsive design

| Test Type | Scope | Tool | Priority |
|-----------|-------|------|----------|
| **Mobile viewport** | All 26 pages at 375px width - layout, readability, touch targets | Playwright (mobile) | P2 |
| **Tablet viewport** | Key pages at 768px width | Playwright (tablet) | P2 |
| **Cross-browser** | Chrome, Firefox, Safari for top 5 pages | Playwright multi-browser | P2 |
| **Reduced motion** | Animated counters respect `prefers-reduced-motion` | Playwright | P2 |
| **Dark mode** | If supported, verify all pages render correctly | Playwright | P3 |
| **Performance** | `/agents` and `/skills` Lighthouse scores (LCP, CLS, FID) | Lighthouse CI | P2 |
| **DOM size** | Pages with >1000 elements flagged for optimization | Playwright | P2 |

**Test Count**: ~50 test cases
**Estimated Effort**: 3-4 days

### Phase 5: Regression Suite (Ongoing)

**Focus**: Automated regression for continuous deployment

| Test Type | Frequency | Scope |
|-----------|-----------|-------|
| **Smoke suite** | Every deploy | All 26 pages load, correct status codes |
| **A11y regression** | Every deploy | axe-core scan on all pages |
| **Visual regression** | Weekly | Screenshot comparison for all 26 pages (desktop + mobile = 52 screenshots) |
| **Link checker** | Daily | All internal and external links |
| **Content snapshot** | Weekly | Agent count, skill count, heading structure |

---

## 7. Mitigation Recommendations

### Immediate Actions (This Sprint)

| # | Action | Risk(s) Addressed | Effort | Impact |
|---|--------|-------------------|--------|--------|
| 1 | **Fix `/docs` to return HTTP 404 or redirect** to actual docs | A1 | 1 hour | Eliminates #1 risk |
| 2 | **Add unique meta descriptions and og:titles per page** | A2 | 4 hours | Eliminates SEO duplication across 26 pages |
| 3 | **Add accessible labels to assessment radio buttons** | C1 | 2 hours | Eliminates critical a11y violation |
| 4 | **Add accessible labels to 13 playbook inputs** | B1 | 2 hours | Eliminates critical a11y violation |
| 5 | **Change contact form from GET to POST** | A7 | 1 hour | Eliminates data-in-URL security risk |

### Short-Term (Next 2 Sprints)

| # | Action | Risk(s) Addressed | Effort |
|---|--------|-------------------|--------|
| 6 | Add `<main>` landmark to all page templates | A3 | 2 hours |
| 7 | Add skip-link to navigation component | A4 | 2 hours |
| 8 | Add `<link rel="canonical">` to all pages | A5 | 2 hours |
| 9 | Fix heading hierarchy (H1 -> H2 -> H3, no skipping) | A10 | 4 hours |
| 10 | Add accessible label to agent search input on `/agents` | C4 | 30 min |
| 11 | Convert OG image from SVG to PNG/JPG for social platform compatibility | A9 | 2 hours |
| 12 | Add URL state to assessment wizard (query params or hash) | C2 | 4 hours |

### Medium-Term (Next Quarter)

| # | Action | Risk(s) Addressed | Effort |
|---|--------|-------------------|--------|
| 13 | Implement lazy loading / virtualization for `/agents` card list | A8 | 1-2 days |
| 14 | Add JSON-LD structured data (Organization, WebSite, FAQPage) | A6 | 1 day |
| 15 | Document assessment scoring algorithm for testability | Testability gap #1 | 1 day |
| 16 | Implement copy-to-clipboard for code blocks in playbook | B4 | 4 hours |
| 17 | Complete "Implementation Patterns" playbook page (currently "Soon") | B3 | Content work |
| 18 | Add `prefers-reduced-motion` support for animated counters | C6 | 2 hours |

---

## Appendix A: Cross-Cutting Findings

### A11y Issues Summary (All 26 Pages)

| Issue | Severity | Pages Affected | WCAG Criterion |
|-------|----------|---------------|----------------|
| No `<main>` landmark | Serious | 26/26 | 1.3.1, 2.4.1 |
| No skip navigation link | Serious | 26/26 | 2.4.1 |
| Heading level skipped (H1 to H3) | Moderate | 2/26 | 1.3.1 |
| Buttons without accessible name | Critical | 1/26 (assessment: 5 buttons) | 4.1.2 |
| Inputs without label | Critical | 2/26 (playbook: 13, agents: 1) | 1.3.1, 4.1.2 |

### SEO Issues Summary (All 26 Pages)

| Issue | Severity | Pages Affected |
|-------|----------|---------------|
| Identical meta description | High | 26/26 |
| Identical og:title | High | 26/26 |
| No canonical URL | Medium | 26/26 |
| No structured data | Low | 26/26 |
| OG image is SVG (limited platform support) | Medium | 26/26 |

### Performance Observations

| Page | DOM Elements | Concern |
|------|-------------|---------|
| `/agents` | 1912 | Exceeds recommended 1500 limit |
| `/skills` | ~1800 | Near recommended limit |
| `/framework` | 916 | Acceptable |
| `/playbook` | 875 | Acceptable |
| All others | <600 | Good |

### Consistent Positive Findings

- All pages have `lang="en"` attribute
- All pages have nav landmark, header, and footer (except `/docs`)
- All images have alt text (0 images without alt across all pages)
- All external links have `target` and `rel` attributes (proper security)
- All pages load under 1 second (max: 829ms for home page)
- Consistent navigation hash (2606/2637) and footer hash (5377) across pages

---

## Appendix B: Risk Assessment Metadata

```json
{
  "assessmentId": "aqe-website-risk-2026-02-16",
  "assessor": "qe-risk-assessor-v3",
  "scope": {
    "domain": "agentic-qe.dev",
    "totalPages": 26,
    "mainPages": 10,
    "playbookPages": 16,
    "interactivePages": 4
  },
  "overallRiskScore": 0.61,
  "riskLevel": "MEDIUM-HIGH",
  "topRiskCategory": "Usability (Accessibility)",
  "totalRisksIdentified": 21,
  "criticalRisks": 4,
  "highRisks": 6,
  "mediumRisks": 8,
  "lowRisks": 3,
  "testabilityScore": 3.4,
  "recommendedTestCases": 240,
  "estimatedTestEffort": "12-16 days",
  "dataSource": "/workspaces/cf-devpod/docs/aqe-website-analysis/raw-analysis.json",
  "screenshotsReviewed": 52
}
```

---

*Generated by QE Risk Assessor V3 -- 2026-02-16*
*Data source: Raw analysis of 26 pages with desktop and mobile screenshots*
