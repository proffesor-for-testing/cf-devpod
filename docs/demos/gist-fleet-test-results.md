# QE Fleet Test Run Results: 14 AI Agents vs 10 Practice Websites

> We pointed 14 specialized QE agents at 10 practice websites and ran UI, API, security, performance, accessibility, fuzz, and meta-review testing. Here's everything we found -- what worked, what didn't, and what we learned about AI-powered quality engineering.

**Fleet**: Agentic QE v3.6.8
**Date**: 2026-02-16
**Runtime**: ~45 minutes total wall time (3 parallel runs)
**Browser**: Playwright + Chromium headless
**HTTP**: Node.js v24 native fetch

---

## TL;DR

- **14 agents** deployed across **3 runs** against **10 target sites**
- **400+ tests/assertions** executed with real browsers and live HTTP requests
- **106 findings**: 23 security, 16 API bugs, 15 a11y violations, 5 visual regressions, 2 perf bottlenecks, 47 review challenges
- **Devil's Advocate agent scored our own work 0.41/1.0** -- pushed us to add security, perf, and fuzz testing in run 3
- **Property-based fuzzing found 4 bugs** that standard contract testing missed (including stored XSS)
- **Root cause analysis** traced 6 surface bugs to just 2 systemic causes

---

## The 14 Agents We Used

| Agent | Type | What It Does |
|-------|------|--------------|
| `qe-contract-validator` | API | Schema validation, status codes, REST conventions |
| `qe-integration-tester` | E2E | Browser-based user journey testing |
| `qe-accessibility-auditor` | A11y | WCAG audit with page structure analysis |
| `qe-visual-tester` | Visual | Multi-viewport screenshot comparison |
| `qe-graphql-tester` | API | Schema introspection, query/mutation testing |
| `qe-security-scanner` | Security | Headers, cookies, DAST probing, CVE detection |
| `qe-performance-tester` | Perf | Baseline, load, stress, endurance testing |
| `qe-property-tester` | Fuzz | Randomized input generation, boundary probing |
| `qe-devils-advocate` | Meta | Critiques other agents' reports for gaps |
| `qe-root-cause-analyzer` | Analysis | Deep investigation with reproduction |
| `a11y-ally` (skill) | A11y | Multi-tool scan (axe-core + pa11y + Lighthouse) |

Plus `fleet_init`, `memory_store`, `memory_query` MCP tools for orchestration and learning.

---

## Run 1: Initial Testing (4 agents, ~3.5 min)

### Restful Booker API -- Contract Validation
- **Agent**: `qe-contract-validator`
- **Target**: https://restful-booker.herokuapp.com
- **Result**: 13 tests, 11 passed, **6 bugs found**

| Bug | Detail |
|-----|--------|
| `GET /ping` returns 201 | Should be 200 for health check |
| `POST /auth` bad creds returns 200 | Security issue -- should be 401 |
| `POST /booking` returns 200 | Should be 201 (REST convention) |
| `DELETE` returns 201 "Created" | Should be 204 No Content |
| Missing fields returns 500 | Should be 400 (no input validation) |
| DELETE body says "Created" | Misleading for a deletion |

**Takeaway**: Contract testing is fast and reliable for catching REST convention violations.

---

### Toolshop -- E2E Integration
- **Agent**: `qe-integration-tester`
- **Target**: https://practicesoftwaretesting.com
- **Result**: **12/12 passed** -- browse, search, product detail, add-to-cart, cart verification

8 screenshots captured across the full flow. 24.3s total execution.

**Takeaway**: Well-built SPAs are reliable E2E targets. But as the Devil's Advocate later pointed out, we only tested happy paths.

---

### The Internet -- Accessibility Audit
- **Agent**: `qe-accessibility-auditor`
- **Target**: https://the-internet.herokuapp.com
- **Result**: 6 pages audited, **15 WCAG violations** found, **72% compliance**

| Severity | Count | Example |
|----------|-------|---------|
| Critical | 2 | Missing form labels on checkboxes and dropdown |
| Serious | 1 | Login button contrast ratio 2.83:1 (needs 4.5:1) |
| Moderate | 12 | No landmarks, heading hierarchy skips, tables missing scope |

9 WCAG success criteria checked across 6 pages with screenshots.

**Takeaway**: Accessibility auditing produces the highest actionable finding density per page scanned.

---

### Sauce Demo -- Visual Regression
- **Agent**: `qe-visual-tester`
- **Target**: https://www.saucedemo.com
- **Result**: **5 of 12 comparisons FAILED** comparing `standard_user` vs `visual_user`

| Finding | Desktop Diff | Mobile Diff |
|---------|-------------|-------------|
| Product image replaced with dog photo | 2.01% | **40.52%** |
| All product prices changed | 2.01% | **40.52%** |
| Cart layout shifts | 0.74% | **18.89%** |

36 screenshots (baseline + test + diff) across 3 viewports.

**Key Insight**: Mobile viewport amplifies visual regressions dramatically. Desktop-only testing misses severity. The same image bug was 2% on desktop but 40% on mobile because the changed element fills more of the smaller screen.

---

## Run 2: API Testing (4 agents, ~3 min)

### JSONPlaceholder -- Contract Validation
- **Agent**: `qe-contract-validator`
- **Result**: **25/25 passed** -- all 6 resource types, CRUD, nested resources, schemas, edge cases
- **Caveat**: This is a mock API. "can-i-deploy: YES" is misleading since POST/PUT/DELETE don't persist.

### API Challenges -- Integration Testing
- **Agent**: `qe-integration-tester`
- **Result**: **19/19 passed**, 17 of 59 challenges completed
- **Covered**: Full CRUD lifecycle, JSON+XML content negotiation, Basic auth -> token -> protected resource chain, input validation

### Countries -- GraphQL Testing
- **Agent**: `qe-graphql-tester`
- **Result**: **64/64 assertions passed** + **2 security warnings**
- **Data**: 250 countries, 7 continents, 114 languages validated
- **Security**: Introspection enabled (schema exposed), no query depth limit (DoS vector via circular nesting)

### HTTPBin -- Protocol Testing
- **Agent**: `qe-contract-validator`
- **Result**: **31/31 passed** -- HTTP methods, status codes, redirects, auth, formats, timing
- **Discovery**: Node.js undici fetch strips `X-Request-Id` headers (platform-specific finding)

---

## Run 3: Deep Testing (6 agents, ~8 min)

This run was triggered after our Devil's Advocate agent reviewed the first two runs and identified major gaps. Run 3 specifically addressed those gaps.

### Security Scan -- 23 findings
- **Agent**: `qe-security-scanner`
- **Targets**: https://ginandjuice.shop + https://the-internet.herokuapp.com

**Gin & Juice Shop (7 findings):**
- No CSP, HSTS, X-Content-Type-Options headers
- AWS ALB cookie missing Secure/HttpOnly
- Backend UUID leaked via `x-backend` header

**The Internet (8 findings):**
- **CRITICAL**: Forgot password crashes with 500 Internal Server Error
- Session cookie missing Secure flag (hijackable over HTTP)
- jQuery 1.11.3 with 6 known CVEs (2019-2021)
- `/download` directory publicly accessible without auth
- Login form enables username enumeration

---

### Performance Testing -- Breaking Point Found
- **Agent**: `qe-performance-tester`
- **Targets**: DemoBlaze API + Toolshop API

**Toolshop API Performance Profile:**

| Concurrency | p95 Latency | Error Rate | Status |
|-------------|-------------|------------|--------|
| 10 | ~100ms | 0% | Healthy |
| 30 | ~200ms | 0% | Degradation onset |
| 50 | ~400ms | 0% | Stressed |
| 80 | 814ms | 0% | Near limit |
| **90** | **10,472ms** | **7.8%** | **Breaking point** |

12.8x latency cliff at 90 concurrent -- connection pool saturation. Server self-heals after ~25 sequential requests post-stress.

---

### Property-Based Fuzzing -- 10 Bugs (4 New)
- **Agent**: `qe-property-tester`
- **Target**: https://restful-booker.herokuapp.com
- **Result**: 127 tests -- 69 pass, 7 fail, 51 interesting

**New bugs the contract tests missed:**

| Bug | Severity | What Happened |
|-----|----------|---------------|
| **Stored XSS** | HIGH | `<script>alert('xss')</script>` stored verbatim in name fields |
| **Date corruption** | HIGH | "not-a-date" stored as `0NaN-aN-aN` |
| Negative prices | MEDIUM | `-999` accepted as totalprice |
| Null bytes | MEDIUM | `\0\0\0` accepted in text fields |
| Checkout before checkin | MEDIUM | No date order validation |
| 50K char strings | LOW | No length limits -- storage DoS potential |
| `"false"` -> `true` | LOW | Truthy string coercion on boolean field |

**Key Insight**: Contract testing found 6 bugs. Fuzz testing on the same API found 10 bugs including a stored XSS vulnerability. Always layer property-based testing on top of contract testing.

---

### Devil's Advocate -- Scored Us 0.41/1.0
- **Agent**: `qe-devils-advocate`
- **Reviewed**: All 8 reports from Runs 1+2
- **Result**: **47 challenges** (8 critical, 16 high, 15 medium, 8 low)

**Most damaging critiques:**

1. Zero security testing across 195+ test cases (addressed in Run 3)
2. Zero performance testing (addressed in Run 3)
3. JSONPlaceholder "can-i-deploy: YES" is a false positive -- it's a mock
4. HTTPBin 100% pass rate is tautological -- testing an echo service
5. Toolshop E2E stops at cart (30% of purchase journey), zero negative tests
6. WCAG audit checked only 9 of 50 success criteria (18%)
7. Five 100% pass rates = tests not trying hard enough

**Key Insight**: Run a Devil's Advocate review after every fleet run. It's the most valuable meta-agent. 100% pass rates should trigger investigation, not celebration.

---

### Root Cause Analysis -- 2 Systemic Causes
- **Agent**: `qe-root-cause-analyzer`
- **Target**: Restful Booker's 6 bugs
- **Method**: 32 real HTTP requests to reproduce and investigate

**All 6 bugs trace to just 2 root causes:**

1. **Express.js `res.sendStatus(201)` misuse** -- Developer used 201 as generic "success" instead of "resource created". Express auto-sets body to "Created", explaining the DELETE response bug.

2. **Zero input validation layer** -- No middleware between HTTP and data. Missing fields crash with unhandled TypeErrors. Auth failures return 200 with body-only differentiation.

Also discovered 3 secondary bugs: DELETE non-existent returns 405 (should be 404), empty string names accepted, wrong types silently coerced to null.

---

### a11y-ally Skill -- Multi-Tool Audit
- **Skill**: `/a11y-ally` (axe-core + pa11y)
- **Target**: https://practicesoftwaretesting.com (4 pages)
- **Result**: **97% compliance**, 1 serious violation on all pages

The language selector button has `aria-hidden="true"` while remaining keyboard-focusable -- screen readers can Tab to it but can't see it. Fix: remove `aria-hidden` and add `aria-label="Select language"`.

Pa11y timed out on this Angular SPA (graceful degradation applied -- axe-core alone provided ~70% detection rate).

---

## What Worked Well

1. **Parallel agent execution** -- 4 agents running simultaneously cuts wall time to the slowest agent instead of sum of all
2. **Layered testing** -- Contract -> Fuzz -> Root Cause on the same target produced exponentially more findings at each layer
3. **Devil's Advocate as meta-agent** -- Caught systemic weaknesses no individual agent would report about itself
4. **Property-based testing** -- Found critical bugs (stored XSS) that contract testing completely missed
5. **Multi-viewport visual testing** -- Mobile amplification effect revealed true bug severity
6. **Learning memory** -- 16 patterns stored for cross-session knowledge transfer

## What Needs Improvement

1. **Happy-path bias** -- Initial runs were 80%+ positive testing. Need 30%+ negative test cases by default
2. **Mock API false confidence** -- JSONPlaceholder and HTTPBin 100% pass rates are meaningless for deployment decisions. Label these "compatibility checks" not "contract validation"
3. **Shallow accessibility coverage** -- Automated tools check ~18-30% of WCAG criteria. Need keyboard navigation + screen reader testing for real compliance
4. **pa11y SPA support** -- Timed out on Angular hash-routed app. Need SPA-aware configuration
5. **No idempotency or concurrency testing** -- APIs weren't tested for race conditions or duplicate request handling
6. **E2E stopped at cart** -- Never tested checkout, payment, order confirmation, error states
7. **Security should be default** -- Header checks and basic DAST should run on every target automatically, not as an optional add-on

## Lessons for QA/QE Teams

1. **Never trust 100% pass rates.** They usually mean the tests aren't trying hard enough.
2. **Fuzz first, contract second.** Property-based testing finds bugs contract testing structurally cannot detect.
3. **Run your own Devil's Advocate.** Assign someone to critique test results before calling them done.
4. **Test mobile viewports.** The same bug can be 2% severity on desktop and 40% on mobile.
5. **Root cause > symptom count.** 6 surface bugs traced to 2 root causes means 2 fixes eliminate all 6.
6. **Layer your testing.** Single-pass testing hits diminishing returns fast. Multi-pass with different techniques compounds findings.

---

## All Reports Generated

| Report | File |
|--------|------|
| Restful Booker API Contract | `restful-booker-api-report.md` |
| Toolshop E2E Integration | `toolshop-e2e-report.md` |
| The Internet WCAG Audit | `the-internet-audit.md` + `.json` |
| Sauce Demo Visual Regression | `saucedemo-visual-report.md` |
| JSONPlaceholder Contract | `jsonplaceholder-api-report.md` |
| API Challenges Integration | `api-challenges-report.md` |
| Countries GraphQL | `countries-graphql-report.md` |
| HTTPBin Protocol | `httpbin-api-report.md` + `.json` |
| Security Scan (2 sites) | `security-scan-report.md` |
| Performance Test (2 APIs) | `performance-test-report.md` + `.json` |
| Property-Based Fuzz Test | `property-test-report.md` + `.json` |
| Devil's Advocate Review | `devils-advocate-review.md` |
| Root Cause Analysis | `root-cause-analysis-restful-booker.md` |
| Toolshop A11y Audit | `accessibility-scans/toolshop/audit-summary.md` |

---

*Generated by AQE v3.6.8 fleet -- 14 agents, 10 targets, 400+ tests. All results from real browser automation and live HTTP requests. No mocked or simulated data.*
