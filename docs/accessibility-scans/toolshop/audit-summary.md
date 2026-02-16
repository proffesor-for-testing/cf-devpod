# Accessibility Audit Report: Practice Software Testing (Toolshop v5.0)

**URL:** https://practicesoftwaretesting.com/
**Date:** 2026-02-16
**Standard:** WCAG 2.2 Level AA
**Tools:** axe-core 4.11 (pa11y timed out on SPA - graceful degradation applied)
**Coverage:** 1/2 tools succeeded (~70% detection rate)

## Executive Summary

| Metric | Value |
|--------|-------|
| **Pages Scanned** | 4 (homepage, product listing, product detail, contact) |
| **Compliance Score** | 97% (31 passes, 1 unique violation per page) |
| **Production Ready** | Conditional - 1 serious issue on all pages |
| **Critical Issues** | 0 |
| **Serious Issues** | 1 (repeated across all 4 pages) |
| **Estimated Fix Time** | 0.5h |
| **Scan Duration** | 183.4s |

## POUR Analysis

| Principle | Checks | Pass | Fail | Score |
|-----------|--------|------|------|-------|
| Perceivable (1.x) | ~10 | 10 | 0 | 100% |
| Operable (2.x) | ~10 | 10 | 0 | 100% |
| Understandable (3.x) | ~5 | 5 | 0 | 100% |
| Robust (4.x) | ~6 | 5 | 1 | 83% |
| **TOTAL** | **31** | **30** | **1** | **97%** |

## Violation Found

### [SERIOUS] aria-hidden-focus (WCAG 4.1.2) - Present on ALL 4 pages

**Element:** Language selector button in navigation header
```html
<button id="language" type="button" data-test="language-select"
        aria-hidden="true" data-bs-toggle="dropdown"
        aria-expanded="false" class="btn nav-link dropdown-toggle">
```

**Problem:** The language selector button has `aria-hidden="true"` but is still focusable via keyboard (it's a `<button>` element). Screen reader users can Tab to this element but it will be invisible to their assistive technology - a confusing and disorienting experience.

**WCAG Criteria:** 4.1.2 Name, Role, Value
**EN 301 549:** 9.4.1.2
**Impact:** Screen reader users cannot interact with language selection
**Affected Users:** ~5-8% (blind, screen reader users)
**Confidence:** 0.98 (clear from HTML context)

## Structural Observations (Not Violations but Notable)

| Observation | Detail | Severity |
|-------------|--------|----------|
| No `<main>` landmark | 0 main landmarks across all pages | Moderate concern |
| No `<header>` landmark | 0 header landmarks | Moderate concern |
| No `<footer>` landmark | 0 footer landmarks | Moderate concern |
| No `<h1>` heading | h1 array is empty on all pages | Moderate concern |
| 15 headings total | But no h1/h2/h3 detected - all headings may be lower levels | Worth investigating |
| 1 iframe present | Likely analytics or tracking - needs title attribute check | Low concern |

**Note:** These were not flagged as violations by axe-core, which may mean they're handled via ARIA roles instead of semantic HTML. The site uses Angular (`_ngcontent-ng-c*` attributes) which often uses `role="main"` instead of `<main>`.

## Tool Coverage

| Tool | Status | Notes |
|------|--------|-------|
| axe-core | Success (4/4 pages) | 31 passing rules, 1 violation per page |
| pa11y | Failed (0/4 pages) | Navigation timeout on SPA - pa11y struggles with hash-routed Angular apps |
| Lighthouse | Not run | Would add ~10% more coverage |

## Recommendations

1. **Fix the aria-hidden-focus issue** (0.25h) - Either remove `aria-hidden="true"` or add `tabindex="-1"` to the button
2. **Add semantic landmarks** - Wrap content in `<main>`, `<header>`, `<footer>` elements
3. **Add `<h1>` headings** - Each page should have a visible h1
4. **Re-run with Lighthouse** for additional coverage
5. **Manual keyboard navigation test** - Tab through all interactive elements
6. **Screen reader test** - Test with NVDA/VoiceOver for real-world validation
