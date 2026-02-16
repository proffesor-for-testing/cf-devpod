# Security & SEO Analysis: agentic-qe.dev

**Date**: 2026-02-16
**Scope**: 26 pages across agentic-qe.dev
**Analyzer**: AQE v3 Security Reviewer (qe-security-reviewer)
**Fleet ID**: fleet-f853a514

---

## Executive Summary

| Category | Score | Rating |
|----------|-------|--------|
| **Security** | 72/100 | MEDIUM |
| **SEO** | 35/100 | CRITICAL |
| **Overall** | 54/100 | NEEDS IMPROVEMENT |

The agentic-qe.dev website has a reasonable security posture for a static documentation site, with most external links properly secured. However, SEO has critical systemic issues: every page shares an identical title tag, identical meta description, no canonical URLs, and no structured data. These issues severely limit search engine visibility and must be addressed.

---

## PART 1: SECURITY REVIEW

### 1.1 External Link Security

**Status**: GOOD (with 3 exceptions)

All 26 pages contain external links. The vast majority correctly include `target="_blank"` with `rel="noopener noreferrer"`, which prevents reverse tabnapping attacks.

**Findings -- External links missing `target="_blank"` and `rel="noopener noreferrer"`:**

| Page | External Link | hasTarget | hasRel | Severity |
|------|--------------|-----------|--------|----------|
| `/playbook/orchestration-strategies` | `https://github.com/fndlalit` (@fndlalit) | false | false | LOW |
| `/playbook/human-in-the-loop` | `https://github.com/fndlalit` (@fndlalit) | false | false | LOW |
| `/playbook/use-cases` | `https://github.com/agentic-qe/issues` (GitHub) | false | false | LOW |

**Risk**: Without `rel="noopener"`, the linked page gains access to `window.opener`, potentially enabling reverse tabnapping. Without `target="_blank"`, the link navigates in the same window, which is a UX issue rather than a security issue per se. In this case, since these links also lack `target="_blank"`, the opener reference is not actually exploitable because navigation happens in the same tab. The risk is therefore **LOW**.

**Remediation**: Add `target="_blank" rel="noopener noreferrer"` to all three links for consistency with the rest of the site.

### 1.2 Form Security

**Status**: MEDIUM CONCERN

Only 1 form exists across all 26 pages, on the homepage (`/`).

**Form Analysis:**

| Property | Value | Assessment |
|----------|-------|------------|
| Action | `https://agentic-qe.dev/` | Submits to homepage |
| Method | `GET` | Data visible in URL |
| CSRF token | Not detected | Missing |
| Input validation (HTML) | `required` on all 3 fields | Basic only |
| Input types | text, email, textarea | Email type provides basic format validation |

**SEC-FORM-001: Contact form uses GET method (MEDIUM)**
- The contact form submits via HTTP GET, which means form data (name, email, message) will appear in the URL as query parameters
- This exposes user PII in browser history, server logs, and referrer headers
- OWASP: A04:2021 - Insecure Design
- **Remediation**: Change form method to POST

**SEC-FORM-002: No CSRF protection detected (MEDIUM)**
- No hidden CSRF token field was detected in the form
- For a static site with no backend session management, this is lower risk, but if the form submits to a backend handler, CSRF protection should be implemented
- OWASP: A01:2021 - Broken Access Control
- **Remediation**: If the form has a server-side handler, implement CSRF tokens

**SEC-FORM-003: No client-side XSS sanitization visible (LOW)**
- The textarea field (`message`) accepts free-text input
- No evidence of client-side sanitization or Content Security Policy restricting inline scripts
- For a static site, the risk depends entirely on how the backend processes submitted data
- OWASP: A03:2021 - Injection
- **Remediation**: Ensure server-side input sanitization; consider CSP headers

### 1.3 Content Security Policy Indicators

**Status**: NOT ASSESSED FROM HTML ALONE

CSP headers are not visible in the raw HTML analysis data. However, indicators from the page data suggest:

| Indicator | Finding |
|-----------|---------|
| Inline styles | Present on all 26 pages (1-22 inline styles per page) |
| Scripts | 1-2 scripts per page |
| External script sources | Not enumerated in data |

**SEC-CSP-001: Inline styles present across all pages (INFO)**
- Inline styles range from 1 to 22 per page (highest on `/playbook/use-cases` with 22)
- A strict CSP would need `'unsafe-inline'` for styles or use nonces/hashes
- **Recommendation**: Audit HTTP response headers for CSP policy; move inline styles to external stylesheets where possible

### 1.4 Mixed Content Risks

**Status**: LOW RISK

- All internal links use `https://agentic-qe.dev/` (HTTPS)
- All external links use HTTPS (`https://github.com/...`, `https://linkedin.com/...`, etc.)
- The OG image uses a relative path (`/og-image.svg`), which will resolve to the same protocol as the page
- No HTTP (non-secure) URLs detected in any of the 26 pages

**Assessment**: No mixed content risks identified.

### 1.5 Information Disclosure

**Status**: LOW RISK

| Check | Finding | Severity |
|-------|---------|----------|
| Server version headers | Not visible in HTML data | N/A |
| Error page information | `/docs` returns 200 with a 404 page (soft 404) | MEDIUM |
| Technology stack disclosure | No framework fingerprinting visible | LOW |
| Author information | `meta author: "Dragan Spiridonov"` on all pages | INFO |
| Email addresses in HTML | None detected | GOOD |

**SEC-INFO-001: Soft 404 on /docs (MEDIUM)**
- The `/docs` path returns HTTP 200 but displays a "404 - Page not found" message (20 words total)
- Search engines will index this as a real page with thin content
- **Remediation**: Return proper HTTP 404 status code, or redirect to appropriate documentation page

### 1.6 Cookie/Storage Security Patterns

**Status**: NOT ASSESSABLE

- No cookie-setting patterns visible in the raw HTML data
- No `localStorage` or `sessionStorage` API calls visible in HTML
- The assessment tool on `/assessment` uses `radiogroup` ARIA roles suggesting client-side state management via JavaScript, but no storage mechanism is visible in HTML alone

**Recommendation**: Perform runtime analysis to check for cookies and storage usage, and verify appropriate `Secure`, `HttpOnly`, and `SameSite` flags on any cookies.

### 1.7 Additional Security Observations

**SEC-MISC-001: No Subresource Integrity (SRI) detected (LOW)**
- External scripts should use `integrity` attributes to prevent supply-chain attacks
- Not verifiable from the current data set

**SEC-MISC-002: Assessment tool radio buttons without labels (MEDIUM)**
- `/assessment` page has 5 buttons without accessible labels
- `/playbook/tools-templates` has 3 buttons without accessible labels
- While primarily an accessibility issue, unlabeled interactive elements can also indicate XSS attack surface if labels are dynamically generated

---

## PART 2: SEO REVIEW

### 2.1 Title Tags

**Status**: CRITICAL

**Every page on the site uses the exact same title tag:**

> "Agentic QE Framework - Bridge Classical to Autonomous Quality Engineering" (73 characters)

| Metric | Value | Assessment |
|--------|-------|------------|
| Title present | 26/26 (100%) | GOOD |
| Title length | 73 chars (all pages) | ACCEPTABLE (under 60 ideal, under 70 good, 73 is slightly long) |
| Title uniqueness | 1 unique title across 26 pages | CRITICAL FAILURE |

**SEO-TITLE-001: All 26 pages share identical title tags (CRITICAL)**

Search engines use title tags as the primary signal for page relevance. Having identical titles across all pages means:
- Google will display the same title for all pages in search results
- Pages cannot be differentiated by searchers
- Keyword targeting per page is impossible
- Click-through rates will be poor

**Recommended unique titles per page:**

| Page | Current Title | Suggested Title |
|------|--------------|-----------------|
| `/` | (same for all) | Agentic QE Framework - Autonomous Quality Engineering with PACT |
| `/framework` | (same) | PACT Framework - Proactive, Autonomous, Collaborative, Targeted QE |
| `/agents` | (same) | 60 QE Agents Catalog - Agentic QE Framework |
| `/playbook` | (same) | Implementation Playbook - Getting Started with Agentic QE |
| `/contributors` | (same) | Contributors & Inspirations - Agentic QE Framework |
| `/assessment` | (same) | PACT Maturity Assessment Tool - Agentic QE |
| `/integrations` | (same) | Deep Ecosystem Integration - Claude Flow, Vibium, MCP |
| `/migration` | (same) | V2 to V3 Migration Guide - Agentic QE Framework |
| `/skills` | (same) | 71 QE Skills Library - Agentic QE Framework |
| `/playbook/*` (14 pages) | (same) | Should reflect each playbook topic |

### 2.2 Meta Descriptions

**Status**: CRITICAL

**Every page uses the exact same meta description:**

> "Evolution from testing-as-activity to agents-as-orchestrators. Learn the PACT principles for building explainable, autonomous quality systems." (142 characters)

| Metric | Value | Assessment |
|--------|-------|------------|
| Description present | 26/26 (100%) | GOOD |
| Description length | 142 chars (all pages) | GOOD (120-160 is ideal) |
| Description uniqueness | 1 unique across 26 pages | CRITICAL FAILURE |

**SEO-META-001: All 26 pages share identical meta descriptions (CRITICAL)**

This is the snippet Google shows in search results. When all pages have the same description, Google often ignores it entirely and auto-generates snippets from page content, reducing control over messaging.

**Remediation**: Write unique, page-specific meta descriptions for each of the 26 pages, incorporating target keywords for that page.

### 2.3 Open Graph and Twitter Card Completeness

**Status**: PARTIAL

**Present on all 26 pages:**

| Tag | Value | Assessment |
|-----|-------|------------|
| `og:title` | Same as page title (identical across all 26) | POOR - should be unique per page |
| `og:description` | Same as meta description (identical across all 26) | POOR - should be unique per page |
| `og:type` | `website` | OK for homepage, should be `article` for content pages |
| `og:image` | `/og-image.svg` | CONCERN - relative path, SVG format |
| `og:image:width` | `1200` | GOOD |
| `og:image:height` | `630` | GOOD |
| `twitter:card` | `summary_large_image` | GOOD |
| `twitter:site` | `@agentic_qe` | GOOD |
| `twitter:image` | `/og-image.svg` | CONCERN - SVG format |

**Missing tags:**

| Tag | Impact |
|-----|--------|
| `og:url` | Missing on ALL 26 pages - prevents proper URL deduplication when sharing |
| `twitter:title` | Missing - falls back to og:title |
| `twitter:description` | Missing - falls back to og:description |

**SEO-OG-001: OG image uses SVG format (MEDIUM)**
- Facebook, LinkedIn, and Twitter require raster image formats (PNG, JPG)
- SVG images are NOT supported by most social media platforms
- Shared links will show no preview image
- **Remediation**: Convert og-image.svg to PNG (1200x630px) and update all meta tags

**SEO-OG-002: OG image uses relative path (LOW)**
- The `og:image` value is `/og-image.svg` (relative)
- The Open Graph protocol specification requires absolute URLs
- Some crawlers may handle this, but many will not
- **Remediation**: Use absolute URL: `https://agentic-qe.dev/og-image.png`

**SEO-OG-003: Missing og:url on all pages (MEDIUM)**
- Without `og:url`, social platforms cannot canonicalize shared URLs
- **Remediation**: Add `og:url` with the canonical URL for each page

### 2.4 Heading Hierarchy

**Status**: MIXED

| Check | Pages Passing | Pages Failing | Details |
|-------|--------------|---------------|---------|
| Has exactly 1 H1 | 24/26 | 2/26 | Two pages have 0 H1 tags |
| H1 comes first in heading order | ~20/26 | ~6/26 | Some pages start with H2 or H3 |
| No heading level skips (H1->H2->H3) | ~8/26 | ~18/26 | Many pages skip from H1 to H3 |

**Pages with 0 H1 tags:**

| Page | First Heading | Issue |
|------|--------------|-------|
| `/playbook/implementation-patterns` | H2: "Implementation Playbook" | Missing H1 entirely |
| `/playbook/domain-driven-qe` | H2: "Implementation Playbook" | Missing H1 entirely |

**SEO-H-001: Heading level skipping is pervasive (MEDIUM)**

The most common pattern across the site is H1 followed directly by H3 (skipping H2). This occurs on approximately 18 of 26 pages. Examples:
- `/` : H1 -> H3 (skips H2)
- `/framework` : H1 -> H3 (skips H2)
- `/agents` : H1 -> H3 (skips H2, no H2 tags at all)

The heading hierarchy should follow a logical outline: H1 -> H2 -> H3. Skipping levels signals to search engines that the content structure is not well-organized.

**SEO-H-002: Duplicate heading text (LOW)**
- The homepage has duplicate H3 headings: "Proactive" appears 3 times, "Autonomous" 2 times, etc.
- While not a strict SEO issue, it dilutes heading relevance

### 2.5 Canonical URLs

**Status**: CRITICAL

| Metric | Value |
|--------|-------|
| Pages with canonical URL | 0/26 |
| Pages without canonical URL | 26/26 |

**SEO-CANON-001: No canonical URLs on any page (CRITICAL)**

Without canonical URLs:
- Search engines cannot determine the preferred version of each page
- If the site is accessible via both `www.` and non-`www.` or `http://` and `https://`, duplicate content issues will occur
- URL parameters (e.g., `?utm_source=...`) create duplicate pages
- The `/playbook/getting-started` and `/playbook` pages may have overlapping content with no way to signal the primary URL

**Remediation**: Add `<link rel="canonical" href="https://agentic-qe.dev/{path}">` to every page with its own absolute URL.

### 2.6 Structured Data (JSON-LD)

**Status**: CRITICAL

| Metric | Value |
|--------|-------|
| Pages with JSON-LD | 0/26 |
| Pages with any structured data | 0/26 |

**SEO-SD-001: No structured data on any page (HIGH)**

The site is missing a significant opportunity for rich search results:

| Recommended Schema | Page(s) | Benefit |
|-------------------|---------|---------|
| `Organization` | `/` (homepage) | Knowledge panel, brand visibility |
| `WebSite` with `SearchAction` | `/` | Sitelinks search box |
| `SoftwareApplication` | `/framework` | Software rich results |
| `FAQPage` | `/assessment` | FAQ rich results |
| `BreadcrumbList` | All playbook pages | Breadcrumb display in SERPs |
| `Person` | `/contributors` | People knowledge panels |
| `HowTo` | `/playbook/getting-started` | How-to rich results |

**Remediation**: Implement JSON-LD structured data, starting with `Organization` and `BreadcrumbList` schemas.

### 2.7 Image Alt Text Coverage

**Status**: GOOD

| Metric | Value |
|--------|-------|
| Total images without alt text | 0 across all 26 pages |
| Total images detected | 0 across all 26 pages |

The site appears to use zero `<img>` elements, relying entirely on CSS, SVG inline elements, and text-based content. While there are no alt text issues, the complete absence of images may negatively impact engagement and visual search indexing.

**SEO-IMG-001: No images used across entire site (INFO)**
- Consider adding relevant images (architecture diagrams, agent flowcharts) with descriptive alt text
- Images can drive traffic via Google Image Search

### 2.8 Content Word Count and Quality Signals

**Status**: MIXED

| Page | Path | Word Count | Assessment |
|------|------|-----------|------------|
| `/docs` | /docs | 20 | CRITICAL - Soft 404 page |
| `/assessment` | /assessment | 105 | THIN - Interactive tool, low text |
| `/playbook/agent-design-patterns` | /playbook/agent-design-patterns | 124 | THIN |
| `/playbook/domain-driven-qe` | /playbook/domain-driven-qe | 124 | THIN |
| `/` | / | 385 | LOW |
| `/migration` | /migration | 393 | LOW |
| `/playbook/tools-templates` | /playbook/tools-templates | 431 | ACCEPTABLE |
| `/integrations` | /integrations | 503 | ACCEPTABLE |
| `/playbook/model-routing` | /playbook/model-routing | 529 | ACCEPTABLE |
| `/playbook/queen-orchestration` | /playbook/queen-orchestration | 546 | ACCEPTABLE |
| `/contributors` | /contributors | 565 | ACCEPTABLE |
| `/playbook/v3-workflows` | /playbook/v3-workflows | 792 | GOOD |
| `/playbook/learning` | /playbook/learning | 793 | GOOD |
| `/playbook/tools-templates` | /playbook/tools-templates | 754 | GOOD |
| `/playbook/browser-automation` | /playbook/browser-automation | 779 | GOOD |
| `/playbook/migration` | /playbook/migration | 866 | GOOD |
| `/playbook/fleet-configuration` | /playbook/fleet-configuration | 908 | GOOD |
| `/playbook/human-in-the-loop` | /playbook/human-in-the-loop | 1144 | GOOD |
| `/playbook/implementation-patterns` | /playbook/implementation-patterns | 1156 | GOOD |
| `/playbook/orchestration-strategies` | /playbook/orchestration-strategies | 1224 | GOOD |
| `/framework` | /framework | 1269 | GOOD |
| `/playbook/assessment-guide` | /playbook/assessment-guide | 1541 | EXCELLENT |
| `/playbook/getting-started` | /playbook/getting-started | 1541 | EXCELLENT |
| `/skills` | /skills | 2263 | EXCELLENT |
| `/agents` | /agents | 2313 | EXCELLENT |
| `/playbook/use-cases` | /playbook/use-cases | 501 | ACCEPTABLE |

**Content quality statistics:**
- Pages under 200 words (thin content): 3 pages (12%)
- Pages 200-500 words: 5 pages (19%)
- Pages 500-1000 words: 10 pages (38%)
- Pages over 1000 words: 8 pages (31%)

**SEO-CONTENT-001: Thin content on 3 pages (MEDIUM)**
- `/docs` (20 words) - This is a soft 404 and should not be indexed
- `/assessment` (105 words) - Interactive tool with minimal text content
- `/playbook/agent-design-patterns` and `/playbook/domain-driven-qe` (124 words each) - These playbook pages need more substantive content

---

## PART 3: CROSS-CUTTING CONCERNS

### 3.1 Accessibility Issues Impacting SEO

| Issue | Pages Affected | Impact |
|-------|---------------|--------|
| No skip link | 26/26 (ALL) | A11y/UX - not direct SEO |
| No `<main>` landmark | 26/26 (ALL) | Crawlers use landmarks for content identification |
| Buttons without labels | `/assessment` (5), `/playbook/tools-templates` (3) | A11y concern |
| Inputs without labels | `/playbook` (1), `/contributors` (13), `/playbook/getting-started` (1), `/playbook/assessment-guide` (13), `/playbook/use-cases` (21) | A11y/form UX concern |

### 3.2 Navigation Consistency

Two distinct `navHash` values were detected:
- `navHash: 2606` -- used on 3 pages (/, /framework, /agents)
- `navHash: 2637` -- used on 23 pages

This indicates a minor navigation structure difference between the original 3 main pages and the remaining 23. This could confuse crawlers if navigation links differ.

### 3.3 Footer Consistency

- `footerHash: 5377` -- 25 pages
- `footerHash: 0` -- 1 page (`/docs` soft 404, missing footer)

The `/docs` page is missing its footer entirely, further confirming it should be a proper 404 or redirect.

---

## PART 4: PRIORITIZED RECOMMENDATIONS

### Critical Priority (Fix Immediately)

| ID | Issue | Category | Impact |
|----|-------|----------|--------|
| SEO-TITLE-001 | All 26 pages share identical title tag | SEO | Search visibility near zero for individual pages |
| SEO-META-001 | All 26 pages share identical meta description | SEO | No differentiated SERP snippets |
| SEO-CANON-001 | No canonical URLs on any page | SEO | Duplicate content risk, URL normalization failure |

### High Priority (Fix This Sprint)

| ID | Issue | Category | Impact |
|----|-------|----------|--------|
| SEO-SD-001 | No structured data on any page | SEO | Missing rich result opportunities |
| SEO-OG-001 | OG image is SVG (unsupported by social platforms) | SEO/Social | No preview images when shared |
| SEO-OG-003 | Missing og:url on all pages | SEO/Social | Social sharing deduplication issues |
| SEC-INFO-001 | /docs returns 200 for a 404 page | Security/SEO | Soft 404 indexed as thin content |
| SEC-FORM-001 | Contact form uses GET method | Security | User PII exposed in URLs |

### Medium Priority (Fix This Month)

| ID | Issue | Category | Impact |
|----|-------|----------|--------|
| SEC-FORM-002 | No CSRF token on contact form | Security | Potential form abuse |
| SEO-H-001 | Heading level skipping on 18 pages | SEO | Weakened content hierarchy signals |
| SEO-CONTENT-001 | Thin content on 3 pages | SEO | Pages may be flagged as low quality |
| SEO-OG-002 | OG image uses relative path | SEO | Some crawlers fail to resolve |

### Low Priority (Backlog)

| ID | Issue | Category | Impact |
|----|-------|----------|--------|
| SEC links | 3 external links missing rel="noopener" | Security | Minimal risk (same-tab navigation) |
| SEC-FORM-003 | No visible XSS sanitization on form | Security | Depends on backend |
| SEC-CSP-001 | Inline styles may complicate CSP | Security | Informational |
| SEO-H-002 | Duplicate heading text | SEO | Minor relevance dilution |
| SEO-IMG-001 | No images on entire site | SEO | Missed image search traffic |

---

## PART 5: PAGE-BY-PAGE SUMMARY

| # | Path | Security | SEO | Key Issues |
|---|------|----------|-----|------------|
| 1 | `/` | MEDIUM | CRITICAL | Form security (GET method, no CSRF); duplicate title/desc |
| 2 | `/framework` | GOOD | CRITICAL | Duplicate title/desc; H1->H3 skip |
| 3 | `/agents` | GOOD | CRITICAL | Duplicate title/desc; no H2 tags; H1->H3 skip |
| 4 | `/playbook` | GOOD | CRITICAL | Duplicate title/desc; 1 input without label |
| 5 | `/contributors` | GOOD | CRITICAL | Duplicate title/desc; 13 inputs without labels |
| 6 | `/assessment` | GOOD | CRITICAL | Duplicate title/desc; 5 buttons without labels; thin content |
| 7 | `/integrations` | GOOD | CRITICAL | Duplicate title/desc |
| 8 | `/migration` | GOOD | CRITICAL | Duplicate title/desc |
| 9 | `/docs` | MEDIUM | CRITICAL | Soft 404 (200 status); no footer; 20 words |
| 10 | `/skills` | GOOD | CRITICAL | Duplicate title/desc |
| 11 | `/playbook/getting-started` | GOOD | CRITICAL | Duplicate title/desc; 1 input without label |
| 12 | `/playbook/assessment-guide` | GOOD | CRITICAL | Duplicate title/desc; 13 inputs without labels |
| 13 | `/playbook/implementation-patterns` | GOOD | CRITICAL | Missing H1; duplicate title/desc |
| 14 | `/playbook/agent-design-patterns` | LOW | CRITICAL | Missing rel on ext link; thin content (124 words) |
| 15 | `/playbook/orchestration-strategies` | LOW | CRITICAL | Missing rel on ext link |
| 16 | `/playbook/human-in-the-loop` | LOW | CRITICAL | Missing rel on ext link |
| 17 | `/playbook/v3-workflows` | GOOD | CRITICAL | Duplicate title/desc |
| 18 | `/playbook/domain-driven-qe` | GOOD | CRITICAL | Missing H1; thin content (124 words) |
| 19 | `/playbook/model-routing` | GOOD | CRITICAL | Duplicate title/desc |
| 20 | `/playbook/queen-orchestration` | GOOD | CRITICAL | Duplicate title/desc |
| 21 | `/playbook/learning` | GOOD | CRITICAL | Duplicate title/desc |
| 22 | `/playbook/browser-automation` | GOOD | CRITICAL | Duplicate title/desc |
| 23 | `/playbook/fleet-configuration` | GOOD | CRITICAL | Duplicate title/desc |
| 24 | `/playbook/migration` | GOOD | CRITICAL | Duplicate title/desc |
| 25 | `/playbook/use-cases` | LOW | CRITICAL | Missing rel on ext link; 21 inputs without labels |
| 26 | `/playbook/tools-templates` | GOOD | CRITICAL | 3 buttons without labels |

---

## Methodology

- **Data source**: Puppeteer-based page crawl extracting DOM metadata, links, forms, accessibility properties, and SEO signals from all 26 pages
- **Security checks**: OWASP Top 10 2021 mapping, external link target/rel audit, form method/CSRF analysis, mixed content scan, information disclosure review
- **SEO checks**: Title/description uniqueness analysis, canonical URL presence, Open Graph/Twitter Card completeness, heading hierarchy validation, structured data presence, content word count assessment
- **Limitations**: This analysis is based on static HTML output only. Server-side headers (CSP, HSTS, cookie flags), JavaScript-rendered content, robots.txt, sitemap.xml, and runtime behavior were not assessed

---

*Generated by AQE v3 Security Reviewer -- 2026-02-16*
