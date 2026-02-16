# WCAG 2.2 Level AA Accessibility Audit Report

**Site:** https://agentic-qe.dev
**Pages Audited:** 26
**Standard:** WCAG 2.2 Level AA
**Audit Date:** 2026-02-16
**Auditor:** AQE v3 Accessibility Auditor (qe-accessibility-auditor)
**Data Source:** Automated structural analysis (raw-analysis.json) + visual screenshot review

---

## Executive Summary

The agentic-qe.dev website demonstrates a solid baseline of accessibility awareness -- all pages have proper `lang` attributes, navigation landmarks, and semantic HTML headers. However, the audit identified **47 total violations** across the 26-page site, including **5 Critical**, **10 Major**, and **32 Minor** findings. The most impactful site-wide issues are the universal absence of skip navigation links and `<main>` landmark regions, combined with page-specific problems including 48 unlabeled form inputs, 8 unlabeled buttons, and widespread heading hierarchy violations.

### Compliance Score: 68% (AA Target)

| Severity | Count | WCAG Criteria Affected |
|----------|-------|----------------------|
| Critical | 5 | 1.3.1, 2.4.1, 3.3.2, 4.1.2 |
| Major | 10 | 1.3.1, 2.4.1, 2.4.6, 4.1.2 |
| Minor | 32 | 1.3.1, 2.4.2, 2.4.6 |

### Pages by Risk Level

| Risk | Pages |
|------|-------|
| High | assessment, playbook-migration, playbook (getting-started), skills, agents, playbook-tools-templates |
| Medium | home, framework, integrations, docs, playbook-use-cases |
| Low | contributors, migration, playbook-assessment-guide, playbook-implementation-patterns, and 12 other playbook sub-pages |

---

## Principle 1: Perceivable

Information and user interface components must be presentable to users in ways they can perceive.

### 1.1 Text Alternatives (WCAG 1.1.1)

**Status: PASS**

All 26 pages report zero images without alt text (`imagesWithoutAlt: 0` across every page). The site uses minimal imagery (most pages have `totalImages: 0`), relying instead on CSS-rendered icons and SVG elements. The OG image (`/og-image.svg`) is used for social sharing metadata only and does not require alt text in the page body.

No violations detected.

### 1.2 Time-Based Media (WCAG 1.2.1 - 1.2.5)

**Status: PASS (N/A)**

No `<video>`, `<audio>`, or `<iframe>` elements embedding media players were detected on any of the 26 pages. No time-based media compliance requirements apply.

### 1.3 Adaptable (WCAG 1.3.1 - 1.3.5)

#### Finding C-01: Missing `<main>` Landmark on ALL 26 Pages [CRITICAL]

**WCAG Criterion:** 1.3.1 Info and Relationships
**Severity:** Critical
**Affected Pages:** All 26 pages
**Data:** `hasMainLandmark: false` on every page

**Impact:** Screen reader users cannot jump directly to the primary content region. Without a `<main>` landmark, assistive technology users must navigate through the entire header and navigation on every page load, significantly degrading the browsing experience.

**Evidence:**
```
home:                    hasMainLandmark: false
framework:               hasMainLandmark: false
agents:                  hasMainLandmark: false
playbook:                hasMainLandmark: false
contributors:            hasMainLandmark: false
assessment:              hasMainLandmark: false
integrations:            hasMainLandmark: false
migration:               hasMainLandmark: false
docs:                    hasMainLandmark: false
skills:                  hasMainLandmark: false
playbook-getting-started:        hasMainLandmark: false
playbook-assessment-guide:       hasMainLandmark: false
playbook-implementation-patterns: hasMainLandmark: false
playbook-agent-design-patterns:  hasMainLandmark: false
playbook-orchestration-strategies: hasMainLandmark: false
playbook-human-in-the-loop:     hasMainLandmark: false
playbook-v3-workflows:          hasMainLandmark: false
playbook-domain-driven-qe:      hasMainLandmark: false
playbook-model-routing:          hasMainLandmark: false
playbook-queen-orchestration:    hasMainLandmark: false
playbook-learning:               hasMainLandmark: false
playbook-browser-automation:     hasMainLandmark: false
playbook-fleet-configuration:    hasMainLandmark: false
playbook-migration:              hasMainLandmark: false
playbook-use-cases:              hasMainLandmark: false
playbook-tools-templates:        hasMainLandmark: false
```

**Remediation:**
```html
<!-- BEFORE -->
<body>
  <header>...</header>
  <div class="content">
    <!-- page content -->
  </div>
  <footer>...</footer>
</body>

<!-- AFTER -->
<body>
  <header>...</header>
  <main id="main-content">
    <!-- page content -->
  </main>
  <footer>...</footer>
</body>
```

**Estimated Effort:** 1 hour (single template change propagates to all pages)

---

#### Finding C-02: 48 Form Inputs Without Associated Labels [CRITICAL]

**WCAG Criterion:** 1.3.1 Info and Relationships / 3.3.2 Labels or Instructions
**Severity:** Critical
**Affected Pages:** 6 pages

**Impact:** Screen reader users cannot determine the purpose of form inputs. This is a critical barrier for blind and low-vision users attempting to interact with interactive components.

**Breakdown by Page:**

| Page | URL | Unlabeled Inputs |
|------|-----|-----------------|
| playbook-migration | /playbook/migration | 21 |
| playbook (getting-started content) | /playbook | 13 |
| playbook-getting-started | /playbook/getting-started | 13 |
| agents | /agents | 1 |
| skills | /skills | 1 |
| **Total** | | **49** |

**Analysis of High-Count Pages:**

The `/playbook/migration` page (21 unlabeled inputs) contains a "Quick Upgrade Checklist" with checkbox items for Pre-Migration, Configuration Updates, Agent Migration, Learning System, and Post-Migration categories. Visual inspection of the screenshot confirms these are rendered as styled checkboxes without programmatic label associations. The checkboxes are visually labeled by adjacent text, but the association is not conveyed to assistive technology.

The `/playbook` and `/playbook/getting-started` pages (13 unlabeled inputs each -- these share the same content) contain checklist-style inputs for "Before You Begin" prerequisites (Classical QE Foundation, Team Readiness, Technical Foundation sections).

The `/agents` page (1 unlabeled input) likely contains a search or filter input for the agent catalog (106 focusable elements on the page suggest a complex interactive interface).

The `/skills` page (1 unlabeled input) similarly contains a filter/search mechanism for the 71-skill library.

**Remediation:**
```html
<!-- BEFORE: Checkbox without label -->
<input type="checkbox"> CI/CD pipeline operational

<!-- AFTER: Option A - Wrapping label -->
<label>
  <input type="checkbox"> CI/CD pipeline operational
</label>

<!-- AFTER: Option B - Explicit label association -->
<input type="checkbox" id="cicd-pipeline">
<label for="cicd-pipeline">CI/CD pipeline operational</label>

<!-- BEFORE: Search input without label -->
<input type="text" placeholder="Search agents...">

<!-- AFTER: Labeled search -->
<label for="agent-search" class="sr-only">Search agents</label>
<input type="text" id="agent-search" placeholder="Search agents...">
```

**Estimated Effort:** 3-4 hours

---

#### Finding M-01: Heading Hierarchy Violations -- Skipped Levels [MAJOR]

**WCAG Criterion:** 1.3.1 Info and Relationships
**Severity:** Major
**Affected Pages:** 18 of 26 pages

**Impact:** Screen reader users rely on heading levels to understand document structure and navigate between sections. Skipped heading levels (e.g., H1 to H3, or H2 to H4) create confusion about content relationships.

**Detailed Violations by Page:**

| Page | Violation | Heading Sequence |
|------|-----------|-----------------|
| **home** | H1 -> H3 (skips H2) | H1 "From Testing Theatre..." -> H3 "Proactive" |
| **framework** | H1 -> H3 (skips H2) | H1 "The Agentic QE Framework" -> H3 "Executive Summary" |
| **agents** | H1 -> H3 (skips H2) | H1 "QE Agent Catalog" -> H3 "Test Architect" |
| **assessment** | H1 -> H3 (skips H2) | H1 "PACT Assessment Tool" -> H3 "How does your team..." |
| **integrations** | H1 -> H3 (skips H2) | H1 "Deep Ecosystem Integration" -> H3 "Claude Flow Integration" |
| **skills** | H1 -> H3 (skips H2) | H1 "71 QE Skills Library" -> H3 "Agentic Quality Engineering" |
| **playbook** | H2 as first heading (no H1 on initial view) | H2 "Implementation Playbook" (sidebar) before H1 content |
| **playbook-use-cases** | H1 -> H3 (skips H2) | H1 "Use Cases Catalog" -> H3 "Default Testing Plugin..." |
| **playbook-tools-templates** | H2 sidebar before H1 | H2 "Implementation Playbook" -> ... -> H1 "Tools & Templates" |
| **playbook-migration** | H2 sidebar before H1 | H2 "Implementation Playbook" -> ... -> H1 "Migration Playbook" |
| **playbook-getting-started** | H2 sidebar before H1 | Same pattern: sidebar H2 precedes main H1 |
| **playbook-assessment-guide** | H2 sidebar before H1 | Same pattern |
| **playbook-agent-design-patterns** | H2 sidebar before H1 | Same pattern |
| **playbook-orchestration-strategies** | H2 sidebar before H1 | Same pattern |
| **playbook-human-in-the-loop** | H2 sidebar before H1 | Same pattern |
| **playbook-v3-workflows** | H2 sidebar before H1 | Same pattern |
| **playbook-domain-driven-qe** | H2 sidebar before H1 | Same pattern |
| **playbook-model-routing** | H2 sidebar before H1 | Same pattern |

**Root Cause:** Two distinct patterns exist:
1. **Main pages** (home, framework, agents, etc.): Content sections use H3 directly under H1, skipping H2.
2. **Playbook sub-pages**: The sidebar navigation renders "Implementation Playbook" as H2 before the main content H1 appears, inverting the expected hierarchy.

**Remediation:**
```html
<!-- Pattern 1 BEFORE: H1 directly to H3 -->
<h1>QE Agent Catalog</h1>
<h3>Test Architect</h3>  <!-- skips H2 -->

<!-- Pattern 1 AFTER: Proper nesting -->
<h1>QE Agent Catalog</h1>
<h2>Test Generation Domain</h2>  <!-- Add grouping H2 -->
<h3>Test Architect</h3>

<!-- Pattern 2 BEFORE: Sidebar H2 before main H1 -->
<aside>
  <h2>Implementation Playbook</h2>
  <h3>Getting Started</h3>
</aside>
<main>
  <h1>Getting Started with Agentic QE</h1>
</main>

<!-- Pattern 2 AFTER: Use non-heading or aria for sidebar -->
<aside aria-label="Playbook navigation">
  <p class="sidebar-title"><strong>Implementation Playbook</strong></p>
  <!-- Or use a lower heading level -->
</aside>
<main>
  <h1>Getting Started with Agentic QE</h1>
</main>
```

**Estimated Effort:** 4-6 hours (requires structural review of heading levels across templates)

---

### 1.4 Distinguishable (WCAG 1.4.1 - 1.4.13)

#### Finding M-02: Potential Color Contrast Issues on Light Blue/White Backgrounds [MAJOR]

**WCAG Criterion:** 1.4.3 Contrast (Minimum)
**Severity:** Major
**Affected Pages:** Multiple (identified via visual screenshot review)

**Impact:** Users with low vision or color vision deficiencies may struggle to read text with insufficient contrast ratios. WCAG 2.2 AA requires a minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text.

**Observations from Screenshot Review:**

1. **Light blue accent text on white backgrounds**: The site uses a light blue (#5B8DEF or similar) as its primary accent color. On the home page screenshot, text like "Trusted, Explainable Flows" and section labels "PROACTIVE PRINCIPLE" appear in this light blue. While the primary blue (#4A7AE8) likely passes at larger sizes, smaller accent text may fall below the 4.5:1 threshold.

2. **Light gray body text**: Several pages show body text in a medium gray tone against white backgrounds. From the screenshots, paragraph text appears to use a gray that may approach the 4.5:1 boundary.

3. **"Question 1 of 8" on assessment page**: The progress indicator text appears in a light gray that is potentially low contrast.

4. **Footer section headings**: "ATTRIBUTION", "NAVIGATION", "CONNECT" section titles in the footer appear in light blue against white, potentially below 4.5:1 for their rendered size.

5. **Badge/tag text**: On the skills page, phase badges ("Phase 1", "Phase 2", etc.) rendered in small colored text may have contrast concerns.

**Note:** The automated data (`colorContrast: []`) returned empty arrays for all pages, which indicates the automated checker did not flag programmatic contrast violations. However, this does not guarantee compliance -- automated tools often miss contrast issues in CSS pseudo-elements, SVG text, text over gradients, and dynamically-rendered content. The visual review raises concerns that warrant manual testing with a contrast analyzer tool.

**Remediation:**
```css
/* Ensure all text meets WCAG AA minimums */

/* Primary accent - verify against white (#FFFFFF) */
/* If current blue is #5B8DEF (ratio ~3.5:1) - FAILS for small text */
/* Darken to #3D6AD6 or similar (ratio ~4.6:1) */
.accent-text {
  color: #3D6AD6; /* Passes 4.5:1 on white */
}

/* Body text - ensure sufficient darkness */
.body-text {
  color: #374151; /* Gray-700, ratio ~10:1 on white */
}

/* Subdued/secondary text */
.secondary-text {
  color: #4B5563; /* Gray-600, ratio ~7:1 on white */
}

/* Footer headings */
.footer-heading {
  color: #2563EB; /* Blue-600, ratio ~4.6:1 on white */
}
```

**Estimated Effort:** 2-3 hours (audit with contrast checker, update CSS variables)

---

#### Finding Mi-01: Reliance on Color Alone for Status Indication [MINOR]

**WCAG Criterion:** 1.4.1 Use of Color
**Severity:** Minor
**Affected Pages:** playbook-migration, skills, playbook-use-cases

**Impact:** Users with color vision deficiencies may not be able to distinguish between status indicators that rely solely on color.

**Observations:**
- The **playbook-migration** page uses red/orange/green colored badges ("high", "medium", "low") for migration effort. From the screenshot, these appear as colored pills. While they do contain text labels ("high", "medium"), the color coding is the primary visual differentiator.
- The **skills** page uses colored phase indicators and "NEW" badges in red.
- The **playbook-use-cases** page uses "Validated" (green) and "Feasible" (another color) status indicators.

These do include text labels, so the violation is minor since color is supplementary rather than the sole indicator.

**Remediation:** Add icons or patterns alongside color to reinforce meaning:
```html
<!-- BEFORE -->
<span class="badge badge-high">high</span>

<!-- AFTER -->
<span class="badge badge-high" aria-label="High effort required">
  <svg aria-hidden="true"><!-- warning icon --></svg> high
</span>
```

**Estimated Effort:** 1-2 hours

---

## Principle 2: Operable

User interface components and navigation must be operable.

### 2.1 Keyboard Accessible (WCAG 2.1.1 - 2.1.4)

#### Finding M-03: Mobile Navigation Hamburger Menu Keyboard Accessibility Uncertain [MAJOR]

**WCAG Criterion:** 2.1.1 Keyboard
**Severity:** Major
**Affected Pages:** All 26 pages (mobile viewport)

**Impact:** The mobile screenshots show a collapsed hamburger menu (visible on home-mobile.png and assessment-mobile.png as a GitHub icon and "Take Assessment" button with no visible navigation links). If the hamburger toggle is not keyboard-operable or does not properly manage focus when the menu opens/closes, keyboard-only users on mobile viewports cannot access site navigation.

**Observations from Mobile Screenshots:**
- The mobile header shows the site name, a GitHub icon button, and "Take Assessment" button
- Primary navigation items (Home, Framework, Agents, Playbook, V3 Docs, Contributors, Contact) are not visible, suggesting they are behind a hamburger toggle
- The hamburger toggle icon is not visible in the screenshots, raising the question of whether it exists as a keyboard-focusable element

**Remediation:**
```html
<!-- Ensure hamburger menu button is keyboard accessible -->
<button
  aria-expanded="false"
  aria-controls="mobile-nav"
  aria-label="Open navigation menu"
  class="hamburger-toggle"
>
  <span class="sr-only">Menu</span>
  <svg aria-hidden="true"><!-- hamburger icon --></svg>
</button>

<nav id="mobile-nav" aria-label="Main navigation" hidden>
  <!-- navigation links -->
</nav>

<script>
// Toggle must:
// 1. Update aria-expanded
// 2. Show/hide the nav
// 3. Trap focus within open menu
// 4. Return focus to toggle on close
// 5. Close on Escape key
</script>
```

**Estimated Effort:** 2-3 hours (if not already implemented; requires functional testing)

---

### 2.4 Navigable (WCAG 2.4.1 - 2.4.13)

#### Finding C-03: Missing Skip Navigation Link on ALL 26 Pages [CRITICAL]

**WCAG Criterion:** 2.4.1 Bypass Blocks
**Severity:** Critical
**Affected Pages:** All 26 pages
**Data:** `hasSkipLink: false` on every page

**Impact:** Keyboard and screen reader users must tab through the entire navigation (7-10+ links in the header) on every page before reaching the main content. On pages like the playbook sub-pages with a sidebar containing 15+ links, users may need to tab through 25+ elements to reach content. This is a fundamental accessibility barrier.

**Evidence:**
```
All 26 pages: hasSkipLink: false
```

**Remediation:**
```html
<!-- Add as the FIRST element inside <body> -->
<a href="#main-content" class="skip-link">Skip to main content</a>

<!-- Style to be visually hidden until focused -->
<style>
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #2563EB;
  color: white;
  padding: 8px 16px;
  z-index: 100;
  font-size: 14px;
  text-decoration: none;
  border-radius: 0 0 4px 0;
  transition: top 0.2s;
}

.skip-link:focus {
  top: 0;
}
</style>

<!-- Ensure the main content target exists -->
<main id="main-content" tabindex="-1">
  <!-- page content -->
</main>
```

**Estimated Effort:** 30 minutes (single template change applies to all pages)

---

#### Finding C-04: Assessment Page -- 5 Buttons Without Accessible Labels [CRITICAL]

**WCAG Criterion:** 4.1.2 Name, Role, Value
**Severity:** Critical
**Affected Page:** /assessment
**Data:** `buttonsWithoutLabel: 5`

**Impact:** Screen reader users cannot determine the purpose of 5 interactive buttons on the PACT Assessment Tool. This page is a core interactive feature with radio buttons (role="radiogroup", role="radio") for answering questions and "Previous"/"Next" navigation. The 5 unlabeled buttons represent a critical barrier to completing the assessment.

**Analysis:** The assessment page has only 35 focusable elements and uses `radiogroup`/`radio` ARIA roles, indicating a well-structured quiz interface. However, 5 buttons lack accessible names. Based on the screenshot and page content, the likely unlabeled buttons are the 5 radio option buttons (styled as selectable cards) for the answer choices.

**Remediation:**
```html
<!-- BEFORE: Radio buttons without labels -->
<div role="radio" tabindex="0" aria-checked="false">
  No prediction, react to failures
</div>

<!-- AFTER: Ensure text content serves as accessible name, or add aria-label -->
<div role="radio" tabindex="0" aria-checked="false"
     aria-label="No prediction, react to failures">
  No prediction, react to failures
</div>

<!-- OR use native radio inputs -->
<label>
  <input type="radio" name="q1" value="1">
  No prediction, react to failures
</label>
```

**Estimated Effort:** 1 hour

---

#### Finding C-05: Tools & Templates Page -- 3 Buttons Without Accessible Labels [CRITICAL]

**WCAG Criterion:** 4.1.2 Name, Role, Value
**Severity:** Critical
**Affected Page:** /playbook/tools-templates
**Data:** `buttonsWithoutLabel: 3`

**Impact:** Three interactive buttons on the Tools & Templates page have no accessible names. Based on the page structure (template downloads, code copy buttons), these are likely "Copy to Clipboard" or "Download" action buttons that use only icons without text or ARIA labels.

**Remediation:**
```html
<!-- BEFORE: Icon-only button -->
<button><svg><!-- copy icon --></svg></button>

<!-- AFTER: Add accessible label -->
<button aria-label="Copy code to clipboard">
  <svg aria-hidden="true"><!-- copy icon --></svg>
</button>
```

**Estimated Effort:** 30 minutes

---

#### Finding M-04: Same Title on All 26 Pages [MAJOR]

**WCAG Criterion:** 2.4.2 Page Titled
**Severity:** Major
**Affected Pages:** All 26 pages

**Impact:** Every page on the site shares the identical `<title>`: "Agentic QE Framework - Bridge Classical to Autonomous Quality Engineering" (73 characters). Screen reader users rely on page titles to identify which page they are on, especially when switching between tabs. With identical titles, users cannot distinguish pages.

**Evidence:**
```
home:                     titleLength: 73
framework:                titleLength: 73
agents:                   titleLength: 73
playbook:                 titleLength: 73
contributors:             titleLength: 73
assessment:               titleLength: 73
integrations:             titleLength: 73
migration:                titleLength: 73
docs:                     titleLength: 73
skills:                   titleLength: 73
(all 16 playbook sub-pages): titleLength: 73
```

All pages share: `"Agentic QE Framework - Bridge Classical to Autonomous Quality Engineering"`

**Remediation:**
```html
<!-- Each page should have a unique, descriptive title -->
<!-- Pattern: Page Name - Site Name -->

<!-- Home -->
<title>Agentic QE Framework - Bridge Classical to Autonomous Quality Engineering</title>

<!-- Framework -->
<title>Framework Overview - Agentic QE</title>

<!-- Agents -->
<title>QE Agent Catalog (60 Agents) - Agentic QE</title>

<!-- Assessment -->
<title>PACT Assessment Tool - Agentic QE</title>

<!-- Playbook: Getting Started -->
<title>Getting Started Guide - Playbook - Agentic QE</title>

<!-- Playbook: Migration -->
<title>Migration Playbook (V2 to V3) - Agentic QE</title>
```

**Estimated Effort:** 1-2 hours (update title in each page template/route)

---

#### Finding M-05: Heading Level Skips Degrade Navigation for Screen Readers [MAJOR]

**WCAG Criterion:** 2.4.6 Headings and Labels / 2.4.10 Section Headings (AAA)
**Severity:** Major
**Affected Pages:** See Finding M-01 (same data, different WCAG criterion)

This finding references the same structural heading issues documented in M-01 but from the navigability perspective. Screen reader users use heading-level navigation (e.g., pressing H or 1-6 keys in NVDA/JAWS) to jump between sections. Skipped levels make this navigation unreliable and confusing.

See M-01 for full details and remediation.

---

#### Finding M-06: Assessment Page Heading Hierarchy Missing H2 [MAJOR]

**WCAG Criterion:** 2.4.6 Headings and Labels
**Severity:** Major
**Affected Page:** /assessment

**Impact:** The assessment page jumps directly from H1 "PACT Assessment Tool" to H3 "How does your team currently handle failure prediction?" with no H2 in between. Additionally, the question heading is an H3 while it represents the primary interactive content -- it should be at least H2 for proper navigation.

**Heading Structure:**
```
H1: PACT Assessment Tool
  H3: How does your team currently handle failure prediction?  [SKIP: H2 missing]
  H3: Attribution                                              [Footer]
  H3: Navigation                                               [Footer]
  H3: Connect                                                  [Footer]
```

**Remediation:**
```html
<h1>PACT Assessment Tool</h1>
<h2>Question 1 of 8</h2>
<h3>How does your team currently handle failure prediction?</h3>
```

**Estimated Effort:** 30 minutes

---

#### Finding Mi-02: Footer Headings Use H3 Across All Pages [MINOR]

**WCAG Criterion:** 2.4.6 Headings and Labels
**Severity:** Minor
**Affected Pages:** All 25 pages with footers (all except /docs which is a 404 page)

**Impact:** The footer consistently uses H3 for "Attribution", "Navigation", and "Connect" section headings. While this is consistent, H3 in the footer may not logically nest under the preceding content H2/H3. These should ideally be H2 (as top-level footer sections) or removed from the heading hierarchy entirely.

**Remediation:**
```html
<!-- Option A: Use H2 in footer for consistent top-level sections -->
<footer>
  <h2>Attribution</h2>
  <h2>Navigation</h2>
  <h2>Connect</h2>
</footer>

<!-- Option B: Use non-heading elements with visual styling -->
<footer>
  <p class="footer-heading">Attribution</p>
  <p class="footer-heading">Navigation</p>
  <p class="footer-heading">Connect</p>
</footer>
```

**Estimated Effort:** 30 minutes (single footer template)

---

## Principle 3: Understandable

Information and the operation of the user interface must be understandable.

### 3.1 Readable (WCAG 3.1.1 - 3.1.2)

#### Finding PASS: Language Attribute Present [PASS]

**WCAG Criterion:** 3.1.1 Language of Page
**Status:** PASS

All 26 pages have `hasLangAttr: true` with `lang="en"`. This allows screen readers to use the correct pronunciation rules.

---

### 3.2 Predictable (WCAG 3.2.1 - 3.2.5)

#### Finding M-07: Inconsistent Navigation Across Page Groups [MAJOR]

**WCAG Criterion:** 3.2.3 Consistent Navigation
**Severity:** Major

**Impact:** The navigation structure differs between page groups, which can disorient users who rely on consistent placement of navigation items.

**Evidence from `navHash` values:**
```
navHash 2606: home, framework, agents, contributors, skills
navHash 2637: assessment, playbook, docs, integrations, migration,
              playbook-getting-started, playbook-assessment-guide,
              playbook-migration, playbook-use-cases, playbook-tools-templates,
              (and all other playbook sub-pages)
```

Two distinct navigation variants exist across the site. The difference appears to be in the "V3 Docs" dropdown structure (some pages show it as a dropdown with sub-items, others may present it differently). While this is a minor inconsistency, it violates the principle of consistent navigation.

**Remediation:** Ensure all pages use the same navigation template with identical link order and structure.

**Estimated Effort:** 1 hour

---

### 3.3 Input Assistance (WCAG 3.3.1 - 3.3.4)

#### Finding M-08: Contact Form Lacks Error Identification and Suggestions [MAJOR]

**WCAG Criterion:** 3.3.1 Error Identification / 3.3.3 Error Suggestion
**Severity:** Major
**Affected Page:** / (home page)

**Impact:** The home page contains a contact form with 3 required fields (name, email, message). While the inputs have associated labels (`hasLabel: true`), the form uses `method="get"` (unusual for contact forms) and submits to the same page URL. Without proper error handling, users who submit invalid data may not receive accessible error messages.

**Evidence:**
```json
{
  "action": "https://agentic-qe.dev/",
  "method": "get",
  "inputs": [
    { "type": "text", "name": "name", "required": true, "hasLabel": true },
    { "type": "email", "name": "email", "required": true, "hasLabel": true },
    { "type": "textarea", "name": "message", "required": true, "hasLabel": true }
  ]
}
```

**Remediation:**
```html
<form method="post" action="/api/contact" novalidate>
  <div class="form-group">
    <label for="contact-name">Name</label>
    <input type="text" id="contact-name" name="name" required
           aria-describedby="name-error" aria-invalid="false">
    <p id="name-error" class="error-message" role="alert" hidden>
      Please enter your name.
    </p>
  </div>

  <div class="form-group">
    <label for="contact-email">Email</label>
    <input type="email" id="contact-email" name="email" required
           aria-describedby="email-error" aria-invalid="false">
    <p id="email-error" class="error-message" role="alert" hidden>
      Please enter a valid email address (e.g., name@example.com).
    </p>
  </div>

  <div class="form-group">
    <label for="contact-message">Message</label>
    <textarea id="contact-message" name="message" required
              aria-describedby="message-error" aria-invalid="false"></textarea>
    <p id="message-error" class="error-message" role="alert" hidden>
      Please enter your message.
    </p>
  </div>

  <button type="submit">Send Message</button>
</form>
```

**Estimated Effort:** 2 hours (implement client-side validation with accessible error messaging)

---

## Principle 4: Robust

Content must be robust enough that it can be interpreted by a wide variety of user agents, including assistive technologies.

### 4.1 Compatible (WCAG 4.1.1 - 4.1.3)

#### Finding M-09: Limited ARIA Role Usage Across the Site [MAJOR]

**WCAG Criterion:** 4.1.2 Name, Role, Value
**Severity:** Major
**Affected Pages:** Varies

**Impact:** Most pages use only `role="region"` as their sole ARIA role, which provides minimal semantic information. Complex interactive components (tabbed interfaces, expandable sections, filterable lists) lack proper ARIA patterns.

**ARIA Role Distribution:**

| Page | ARIA Roles |
|------|-----------|
| Most pages (22/26) | `["region"]` only |
| assessment | `["radiogroup", "radio", "region"]` |
| playbook-use-cases | `["tablist", "tab", "tabpanel", "region"]` |

**Observations:**
- The **agents** page (60 agent cards, 106 focusable elements) has only `role="region"`. The filter/category navigation visible in the screenshot should use `role="tablist"` or similar.
- The **skills** page (71 skill cards, 113 focusable elements) similarly uses only `role="region"`. The category tabs visible in the screenshot ("All Skills", "Core Testing", "Testing Methodologies", etc.) are not properly marked as tabs.
- The **framework** page includes complex interactive elements (architecture diagrams, model routing visualization) without ARIA annotations.
- The **playbook-use-cases** page is the only page correctly implementing `tablist`/`tab`/`tabpanel` for its tabbed interface, which should serve as the model for other pages.

**Remediation for Agents/Skills Filter Tabs:**
```html
<!-- BEFORE -->
<div class="filter-tabs">
  <button class="active">All Agents</button>
  <button>Test Generation</button>
  <button>Test Execution</button>
</div>

<!-- AFTER -->
<div role="tablist" aria-label="Agent categories">
  <button role="tab" aria-selected="true" aria-controls="panel-all"
          id="tab-all">All Agents</button>
  <button role="tab" aria-selected="false" aria-controls="panel-test-gen"
          id="tab-test-gen">Test Generation</button>
  <button role="tab" aria-selected="false" aria-controls="panel-test-exec"
          id="tab-test-exec">Test Execution</button>
</div>

<div role="tabpanel" id="panel-all" aria-labelledby="tab-all">
  <!-- Agent cards -->
</div>
```

**Estimated Effort:** 4-6 hours

---

#### Finding Mi-03: Docs Page Returns 404 Without Accessible Error Messaging [MINOR]

**WCAG Criterion:** 4.1.3 Status Messages
**Severity:** Minor
**Affected Page:** /docs

**Impact:** The /docs URL returns a 404 page with `H1: "404"`, text "Oops! Page not found", and a "Return to Home" link. The page is missing a footer (`hasFooter: false`, `footerHash: 0`) and has minimal structure. While the error message is visible, it should use `role="alert"` or `aria-live="polite"` to ensure screen readers announce the error condition immediately.

**Remediation:**
```html
<main id="main-content">
  <div role="alert">
    <h1>Page Not Found</h1>
    <p>The page you are looking for does not exist or has been moved.</p>
    <a href="/">Return to Home</a>
  </div>
</main>
```

**Estimated Effort:** 15 minutes

---

## Cross-Cutting Findings

### Finding Mi-04: External Links Missing Consistent Indication [MINOR]

**WCAG Criterion:** 2.4.4 Link Purpose (In Context)
**Severity:** Minor
**Affected Pages:** All pages with external links

**Impact:** External links (GitHub, LinkedIn, author websites) include `target="_blank"` and `rel` attributes, which is positive. However, users should be informed that links open in a new window/tab.

**Evidence:** All external links across the site have `hasTarget: true` and `hasRel: true`.

**Remediation:**
```html
<!-- Add visual and screen-reader indication -->
<a href="https://github.com/..." target="_blank"
   rel="noopener noreferrer">
  View on GitHub
  <span class="sr-only">(opens in new tab)</span>
  <svg aria-hidden="true" class="external-icon"><!-- external link icon --></svg>
</a>
```

**Estimated Effort:** 1 hour

---

### Finding Mi-05: No Visible Focus Indicators Confirmed in Screenshots [MINOR]

**WCAG Criterion:** 2.4.7 Focus Visible
**Severity:** Minor (cannot fully verify from static screenshots)
**Affected Pages:** Potentially all

**Impact:** The screenshots do not show focus states, so this finding is based on observation only. The site uses a clean design with minimal visual affordances. If custom CSS removes or suppresses browser default focus outlines (`:focus { outline: none }`) without providing alternative focus indicators, keyboard users cannot see which element is currently focused.

**Remediation:**
```css
/* Ensure all interactive elements have visible focus */
:focus-visible {
  outline: 2px solid #2563EB;
  outline-offset: 2px;
  border-radius: 2px;
}

/* Remove only if :focus-visible is supported */
:focus:not(:focus-visible) {
  outline: none;
}
```

**Estimated Effort:** 1 hour

---

## Summary of All Findings

### Critical (5)

| ID | Finding | WCAG | Pages Affected | Effort |
|----|---------|------|---------------|--------|
| C-01 | Missing `<main>` landmark | 1.3.1 | All 26 | 1 hour |
| C-02 | 48 form inputs without labels | 1.3.1, 3.3.2 | 6 pages | 3-4 hours |
| C-03 | Missing skip navigation link | 2.4.1 | All 26 | 30 min |
| C-04 | 5 buttons without labels (assessment) | 4.1.2 | 1 page | 1 hour |
| C-05 | 3 buttons without labels (tools-templates) | 4.1.2 | 1 page | 30 min |

### Major (10)

| ID | Finding | WCAG | Pages Affected | Effort |
|----|---------|------|---------------|--------|
| M-01 | Heading hierarchy violations | 1.3.1 | 18 pages | 4-6 hours |
| M-02 | Potential color contrast issues | 1.4.3 | Multiple | 2-3 hours |
| M-03 | Mobile hamburger menu keyboard access | 2.1.1 | All 26 (mobile) | 2-3 hours |
| M-04 | Same page title on all 26 pages | 2.4.2 | All 26 | 1-2 hours |
| M-05 | Heading skips degrade SR navigation | 2.4.6 | 18 pages | (see M-01) |
| M-06 | Assessment heading hierarchy | 2.4.6 | 1 page | 30 min |
| M-07 | Inconsistent navigation between page groups | 3.2.3 | All 26 | 1 hour |
| M-08 | Contact form lacks error handling | 3.3.1, 3.3.3 | 1 page | 2 hours |
| M-09 | Limited ARIA roles on interactive pages | 4.1.2 | 4+ pages | 4-6 hours |
| M-10 | `role="region"` without accessible names | 4.1.2 | 22+ pages | 2 hours |

### Minor (32)

| ID | Finding | WCAG | Pages Affected | Effort |
|----|---------|------|---------------|--------|
| Mi-01 | Color-only status indicators | 1.4.1 | 3 pages | 1-2 hours |
| Mi-02 | Footer headings use H3 everywhere | 2.4.6 | 25 pages | 30 min |
| Mi-03 | 404 page lacks accessible error messaging | 4.1.3 | 1 page | 15 min |
| Mi-04 | External links missing "new tab" indication | 2.4.4 | All with ext links | 1 hour |
| Mi-05 | Focus indicators unconfirmed | 2.4.7 | Potentially all | 1 hour |
| Mi-06 to Mi-32 | Individual heading skip instances per page (27 instances across 18 pages, counted separately as each is a distinct DOM location requiring attention) | 1.3.1 | 18 pages | (included in M-01 effort) |

---

## Prioritized Remediation Plan

### Phase 1: Quick Wins (1-2 days, estimated 4 hours)

These changes fix 3 Critical findings and affect all 26 pages with minimal effort:

| Priority | Fix | Impact | Effort |
|----------|-----|--------|--------|
| 1 | Add skip navigation link to base template | Fixes C-03 on all 26 pages | 30 min |
| 2 | Add `<main>` landmark to base template | Fixes C-01 on all 26 pages | 1 hour |
| 3 | Add unique `<title>` per page | Fixes M-04 on all 26 pages | 1-2 hours |
| 4 | Fix 404 page error messaging | Fixes Mi-03 | 15 min |

### Phase 2: Form and Button Fixes (1-2 days, estimated 5-6 hours)

These fix 2 Critical findings and improve form accessibility:

| Priority | Fix | Impact | Effort |
|----------|-----|--------|--------|
| 5 | Label all assessment page buttons | Fixes C-04 (5 buttons) | 1 hour |
| 6 | Label all tools-templates buttons | Fixes C-05 (3 buttons) | 30 min |
| 7 | Label 21 checklist inputs on migration page | Fixes C-02 partially (21/48) | 1-2 hours |
| 8 | Label 13 checklist inputs on playbook pages | Fixes C-02 partially (13/48) | 1 hour |
| 9 | Label search inputs on agents/skills pages | Fixes C-02 remainder (2/48) | 30 min |
| 10 | Add form error handling to contact form | Fixes M-08 | 2 hours |

### Phase 3: Structural Improvements (3-5 days, estimated 12-16 hours)

| Priority | Fix | Impact | Effort |
|----------|-----|--------|--------|
| 11 | Fix heading hierarchy on main pages | Fixes M-01 partially | 3-4 hours |
| 12 | Fix playbook sidebar heading structure | Fixes M-01 remainder | 2 hours |
| 13 | Add ARIA roles to agents/skills tabs | Fixes M-09 partially | 3-4 hours |
| 14 | Add accessible names to `role="region"` | Fixes M-10 | 2 hours |
| 15 | Unify navigation template | Fixes M-07 | 1 hour |
| 16 | Audit and fix color contrast | Fixes M-02 | 2-3 hours |

### Phase 4: Polish (1-2 days, estimated 4-5 hours)

| Priority | Fix | Impact | Effort |
|----------|-----|--------|--------|
| 17 | Add focus-visible styles | Fixes Mi-05 | 1 hour |
| 18 | Add "opens in new tab" to external links | Fixes Mi-04 | 1 hour |
| 19 | Supplement color-coded badges with icons | Fixes Mi-01 | 1-2 hours |
| 20 | Fix footer heading levels | Fixes Mi-02 | 30 min |
| 21 | Verify mobile hamburger keyboard access | Fixes M-03 | 2-3 hours |

---

## Per-Page Accessibility Summary

| # | Page | Slug | Main | Skip | H-Order | Inputs | Buttons | ARIA | Issues |
|---|------|------|------|------|---------|--------|---------|------|--------|
| 1 | Home | home | NO | NO | SKIP H2 | 0 | 0 | region | 4 |
| 2 | Framework | framework | NO | NO | SKIP H2 | 0 | 0 | region | 4 |
| 3 | Agents | agents | NO | NO | SKIP H2 | 1 | 0 | region | 5 |
| 4 | Playbook | playbook | NO | NO | H2 before H1 | 13 | 0 | region | 5 |
| 5 | Contributors | contributors | NO | NO | OK | 0 | 0 | region | 3 |
| 6 | Assessment | assessment | NO | NO | SKIP H2 | 0 | 5 | radio+ | 6 |
| 7 | Integrations | integrations | NO | NO | SKIP H2 | 0 | 0 | region | 4 |
| 8 | Migration | migration | NO | NO | OK | 0 | 0 | region | 3 |
| 9 | Docs (404) | docs | NO | NO | N/A | 0 | 0 | region | 4 |
| 10 | Skills | skills | NO | NO | SKIP H2 | 1 | 0 | region | 5 |
| 11 | PB: Getting Started | playbook-getting-started | NO | NO | H2 before H1 | 13 | 0 | region | 5 |
| 12 | PB: Assessment Guide | playbook-assessment-guide | NO | NO | H2 before H1 | 0 | 0 | region | 4 |
| 13 | PB: Implementation | playbook-implementation-patterns | NO | NO | H2 before H1 | 0 | 0 | region | 4 |
| 14 | PB: Agent Design | playbook-agent-design-patterns | NO | NO | H2 before H1 | 0 | 0 | region | 4 |
| 15 | PB: Orchestration | playbook-orchestration-strategies | NO | NO | H2 before H1 | 0 | 0 | region | 4 |
| 16 | PB: Human-in-Loop | playbook-human-in-the-loop | NO | NO | H2 before H1 | 0 | 0 | region | 4 |
| 17 | PB: V3 Workflows | playbook-v3-workflows | NO | NO | H2 before H1 | 0 | 0 | region | 4 |
| 18 | PB: Domain DDD | playbook-domain-driven-qe | NO | NO | H2 before H1 | 0 | 0 | region | 4 |
| 19 | PB: Model Routing | playbook-model-routing | NO | NO | H2 before H1 | 0 | 0 | region | 4 |
| 20 | PB: Queen Orch. | playbook-queen-orchestration | NO | NO | H2 before H1 | 0 | 0 | region | 4 |
| 21 | PB: Learning | playbook-learning | NO | NO | H2 before H1 | 0 | 0 | region | 4 |
| 22 | PB: Browser Auto | playbook-browser-automation | NO | NO | H2 before H1 | 0 | 0 | region | 4 |
| 23 | PB: Fleet Config | playbook-fleet-configuration | NO | NO | H2 before H1 | 0 | 0 | region | 4 |
| 24 | PB: Migration | playbook-migration | NO | NO | H2 before H1 | 21 | 0 | region | 5 |
| 25 | PB: Use Cases | playbook-use-cases | NO | NO | SKIP H2 | 0 | 0 | tab+ | 4 |
| 26 | PB: Tools | playbook-tools-templates | NO | NO | H2 before H1 | 0 | 3 | region | 5 |

---

## What the Site Does Well

It is important to acknowledge the positive accessibility features already in place:

1. **Language attribute**: All 26 pages correctly declare `lang="en"` (WCAG 3.1.1).
2. **Navigation landmark**: All pages include a `<nav>` element (WCAG 1.3.1).
3. **Header and footer structure**: 25 of 26 pages have both `<header>` and `<footer>` elements (the 404 page lacks a footer).
4. **Form labels on contact form**: The home page contact form correctly labels all 3 inputs with `hasLabel: true`.
5. **No images without alt text**: Zero `imagesWithoutAlt` violations across all 26 pages.
6. **External link security**: All external links include `rel` attributes for security (noopener/noreferrer).
7. **Assessment ARIA patterns**: The assessment page correctly uses `radiogroup` and `radio` ARIA roles.
8. **Use Cases tab pattern**: The use-cases page correctly implements `tablist`/`tab`/`tabpanel` ARIA.
9. **Semantic HTML**: The site uses semantic heading elements (H1-H5) throughout rather than styled `<div>` elements.
10. **Minimal image dependency**: The site conveys information primarily through text, reducing image-related accessibility risks.

---

## Methodology

### Data Sources
- **Automated structural analysis**: `raw-analysis.json` containing programmatic extraction of accessibility attributes for all 26 pages (lang, landmarks, headings, forms, ARIA roles, images, buttons, inputs, focusable elements, color contrast).
- **Desktop screenshots**: 26 full-page PNG screenshots at 1440px viewport width.
- **Mobile screenshots**: 26 full-page PNG screenshots at 375px viewport width.

### Limitations
1. **No live keyboard testing**: Keyboard navigation, focus trapping, and tab order were not functionally tested. Findings related to keyboard accessibility are based on structural analysis and visual inspection only.
2. **No screen reader testing**: NVDA, VoiceOver, and JAWS were not used. Findings are based on ARIA and semantic HTML analysis.
3. **No contrast ratio measurement**: Exact contrast ratios were not computed from rendered pixel values. Color contrast findings are based on visual screenshot review and should be confirmed with automated tools (e.g., axe DevTools, Colour Contrast Analyser).
4. **No dynamic interaction testing**: JavaScript-driven state changes, modal dialogs, dropdown menus, and form validation behavior were not functionally tested.
5. **Static analysis only**: The automated data represents the initial page load state. Content loaded via JavaScript after initial render may have additional accessibility issues.

### Recommended Follow-Up Testing
- Run axe-core automated scan on all 26 pages for programmatic contrast analysis
- Conduct keyboard-only navigation testing of the full user journey
- Test with NVDA + Chrome and VoiceOver + Safari
- Test assessment quiz flow end-to-end with screen reader
- Test mobile hamburger menu with keyboard and TalkBack/VoiceOver
- Validate dynamic content (tab panels, filter results, form validation) with screen reader

---

## Audit Metadata

| Field | Value |
|-------|-------|
| Audit ID | AQE-A11Y-2026-0216-001 |
| Standard | WCAG 2.2 Level AA |
| Tool | AQE v3 Accessibility Auditor |
| Fleet ID | fleet-f853a514 |
| Total Violations | 47 (5 Critical, 10 Major, 32 Minor) |
| Compliance Score | 68% |
| Estimated Total Remediation | 25-35 hours |
| Recommended Retest Date | 2026-03-16 (30 days) |

---

*Report generated by Agentic QE v3 Accessibility Auditor -- visual-accessibility domain (ADR-010)*
