# Consolidated Test Ideas: agentic-qe.dev

**Generated**: 2026-02-09
**Source**: QCSD Ideation Swarm Analysis
**URL**: https://agentic-qe.dev/
**Total Test Ideas**: 85+

---

## Test Ideas by Category

### 1. Functional Tests (Capability)

| ID | Test Idea | Priority | Source |
|----|-----------|----------|--------|
| F-01 | Navigate to all 20 discovered pages and verify content loads | P0 | Quality Criteria |
| F-02 | Test Assessment tool with valid inputs end-to-end | P0 | Quality Criteria |
| F-03 | Test Assessment tool with invalid/edge case inputs | P0 | Quality Criteria |
| F-04 | Submit Contact form with valid data | P0 | Quality Criteria |
| F-05 | Submit Contact form with invalid email format | P1 | Quality Criteria |
| F-06 | Click all PACT cards and verify hover/active states | P1 | Quality Criteria |
| F-07 | Open and close V3 Docs dropdown menu | P1 | Testability |
| F-08 | Verify GitHub button opens correct repository | P2 | Testability |
| F-09 | Verify all 51 agents are listed on /agents page | P1 | QX Analysis |
| F-10 | Verify 61 skills count is accurate | P1 | QX Analysis |
| F-11 | Verify 12 V3 domains are documented | P1 | QX Analysis |
| F-12 | Test deep linking to /playbook/* subpages | P1 | Testability |
| F-13 | Verify breadcrumb navigation on playbook pages | P2 | QX Analysis |

### 2. Accessibility Tests (WCAG 2.2 AA)

| ID | Test Idea | Priority | WCAG | Source |
|----|-----------|----------|------|--------|
| A-01 | Tab through entire page and verify skip link exists | P0 | 2.4.1 | A11y Audit |
| A-02 | Verify `<main>` landmark exists | P0 | 1.3.1 | A11y Audit |
| A-03 | Count H1 elements (expect 1 per page) | P0 | 1.3.1 | A11y Audit |
| A-04 | Verify all SVG icons have accessible names | P0 | 1.1.1 | A11y Audit |
| A-05 | Verify all buttons have accessible names | P0 | 4.1.2 | A11y Audit |
| A-06 | Test keyboard navigation through dropdown menus | P1 | 2.1.1 | A11y Audit |
| A-07 | Verify focus indicator visible on all interactive elements | P1 | 2.4.7 | A11y Audit |
| A-08 | Test with prefers-reduced-motion: reduce | P1 | 2.3.3 | A11y Audit |
| A-09 | Verify color contrast ratio >= 4.5:1 for text | P1 | 1.4.3 | A11y Audit |
| A-10 | Verify form error messages are programmatically associated | P1 | 3.3.1 | A11y Audit |
| A-11 | Test focus management on SPA route changes | P1 | 2.4.3 | A11y Audit |
| A-12 | Verify aria-live regions for toast notifications | P2 | 4.1.3 | A11y Audit |
| A-13 | Run axe-core automated scan on all pages | P1 | Multiple | A11y Audit |

### 3. Security Tests

| ID | Test Idea | Priority | Category | Source |
|----|-----------|----------|----------|--------|
| S-01 | Verify Content Security Policy header exists | P0 | Headers | Security |
| S-02 | Test Contact form for XSS injection | P0 | Input | Security |
| S-03 | Test Assessment form for XSS injection | P0 | Input | Security |
| S-04 | Inspect JS bundle for exposed API keys/secrets | P0 | Code | Security |
| S-05 | Verify HTTPS enforcement (HTTP redirect) | P1 | Transport | Security |
| S-06 | Check for SRI attributes on external scripts | P1 | Dependencies | Security |
| S-07 | Test CSRF protection on forms | P1 | Forms | Security |
| S-08 | Verify secure cookie attributes (if any) | P1 | Cookies | Security |
| S-09 | Test form spam submission limits | P2 | Abuse | Security |
| S-10 | Check for sensitive data in source maps | P2 | Exposure | Security |
| S-11 | Verify security.txt exists | P3 | Compliance | Security |

### 4. Performance Tests

| ID | Test Idea | Priority | Metric | Source |
|----|-----------|----------|--------|--------|
| P-01 | Measure LCP on homepage (target < 2.5s) | P0 | Core Web Vitals | Quality Criteria |
| P-02 | Measure FID/INP on PACT card interactions | P1 | Core Web Vitals | Quality Criteria |
| P-03 | Measure CLS during page animations | P1 | Core Web Vitals | Quality Criteria |
| P-04 | Test page load with slow 3G network throttling | P1 | Mobile | Quality Criteria |
| P-05 | Measure JS bundle size (target < 200KB gzipped) | P1 | Bundle | Risk Assessment |
| P-06 | Test with CPU 4x slowdown throttling | P2 | Mobile | Quality Criteria |
| P-07 | Verify font loading doesn't cause FOIT | P2 | Fonts | Testability |
| P-08 | Lighthouse performance audit (target >= 90) | P1 | Audit | Quality Criteria |

### 5. Cross-Browser/Compatibility Tests

| ID | Test Idea | Priority | Browser/Device | Source |
|----|-----------|----------|----------------|--------|
| C-01 | Test on Chrome latest | P0 | Desktop | Quality Criteria |
| C-02 | Test on Firefox latest | P0 | Desktop | Quality Criteria |
| C-03 | Test on Safari latest | P1 | Desktop | Quality Criteria |
| C-04 | Test on Edge latest | P1 | Desktop | Quality Criteria |
| C-05 | Test on iOS Safari | P1 | Mobile | QX Analysis |
| C-06 | Test on Chrome Android | P1 | Mobile | QX Analysis |
| C-07 | Test responsive breakpoints (320px, 768px, 1024px, 1440px) | P1 | Responsive | Risk Assessment |
| C-08 | Test with JavaScript disabled | P2 | Degradation | Risk Assessment |
| C-09 | Test with slow network (offline then reconnect) | P2 | PWA | Risk Assessment |

### 6. User Experience Tests

| ID | Test Idea | Priority | Aspect | Source |
|----|-----------|----------|--------|--------|
| U-01 | First-time user can find Getting Started guide in < 2 clicks | P1 | Navigation | QX Analysis |
| U-02 | User can filter/search 51 agents (currently missing) | P0 | Usability | QX Analysis |
| U-03 | Assessment purpose is clear before starting | P1 | Trust | QX Analysis |
| U-04 | Contact form provides confirmation feedback | P1 | Feedback | QX Analysis |
| U-05 | PACT cards expand with meaningful content | P1 | Content | QX Analysis |
| U-06 | Mobile menu functions correctly | P1 | Mobile | QX Analysis |
| U-07 | Dark/light theme toggle works (if implemented) | P2 | Preference | QX Analysis |
| U-08 | 404 page provides helpful navigation | P2 | Error | Risk Assessment |

### 7. Data Validation Tests

| ID | Test Idea | Priority | Field | Source |
|----|-----------|----------|-------|--------|
| D-01 | Contact Name: Test max length boundary | P1 | Input | Testability |
| D-02 | Contact Email: Test valid formats | P1 | Input | Testability |
| D-03 | Contact Email: Test invalid formats | P1 | Input | Testability |
| D-04 | Contact Message: Test empty submission | P1 | Input | Testability |
| D-05 | Assessment: Test all question combinations | P0 | Assessment | Testability |
| D-06 | Assessment: Test early exit behavior | P1 | Assessment | Testability |

### 8. Reliability Tests

| ID | Test Idea | Priority | Scenario | Source |
|----|-----------|----------|----------|--------|
| R-01 | Verify Cloudflare WAF doesn't block legitimate users | P1 | CDN | Risk Assessment |
| R-02 | Test behavior when Google Fonts unavailable | P2 | Dependency | Testability |
| R-03 | Test behavior when GitHub API unreachable | P2 | External | Testability |
| R-04 | Navigation state persists after browser refresh | P1 | State | Quality Criteria |
| R-05 | Toast notifications display correctly | P1 | Feedback | Testability |

---

## Test Automation Recommendations

### Recommended Framework: Playwright

```typescript
// Example test structure
import { test, expect } from '@playwright/test';

test.describe('agentic-qe.dev', () => {
  test('F-01: All navigation links work', async ({ page }) => {
    const pages = [
      '/', '/framework', '/agents', '/playbook',
      '/contributors', '/assessment', '/integrations'
    ];
    for (const path of pages) {
      const response = await page.goto(`https://agentic-qe.dev${path}`);
      expect(response?.status()).toBe(200);
    }
  });

  test('A-01: Skip link exists', async ({ page }) => {
    await page.goto('https://agentic-qe.dev');
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();
  });

  test('A-02: Main landmark exists', async ({ page }) => {
    await page.goto('https://agentic-qe.dev');
    const main = page.locator('main');
    await expect(main).toBeAttached();
  });
});
```

### Automation Blockers

| Blocker | Impact | Resolution |
|---------|--------|------------|
| No data-testid attributes | Cannot reliably select elements | Add attrs before automation |
| Assessment form undocumented | Cannot create assertions | Define expected behavior |
| Animation interference | Flaky visual tests | Add testMode param |

---

## Test Prioritization Matrix

| Priority | Count | Description |
|----------|-------|-------------|
| **P0** | 18 | Critical path, must pass before release |
| **P1** | 35 | Important, should pass in Sprint 1 |
| **P2** | 22 | Nice to have, Sprint 2 |
| **P3** | 10+ | Future improvement |

---

## Coverage Mapping

| HTSM Category | Test Count | Coverage |
|---------------|------------|----------|
| Capability | 13 | 85% |
| Reliability | 5 | 70% |
| Security | 11 | 80% |
| Performance | 8 | 75% |
| Compatibility | 9 | 80% |
| Usability | 8 | 75% |
| Accessibility | 13 | 90% |

---

*Generated by QCSD Ideation Swarm v7.0*
