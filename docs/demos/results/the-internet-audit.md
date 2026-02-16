# WCAG Accessibility Audit Report

**Target**: https://the-internet.herokuapp.com
**Date**: 2026-02-16T10:14:52.659Z
**Standard**: WCAG 2.1/2.2 Level AA
**Tool**: Playwright 1.58.2 + Chromium (headless)
**Auditor**: AQE v3 Accessibility Auditor

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Pages Audited | 6 |
| Total Violations | 15 |
| Critical | 2 |
| Serious | 1 |
| Moderate | 12 |
| Minor | 0 |
| Compliance Score | 72% |

### Violations by Severity

- **Critical** (2): Must fix immediately -- blocks access for users with disabilities
- **Serious** (1): Should fix urgently -- significantly impacts accessibility
- **Moderate** (12): Should fix -- degrades accessibility experience
- **Minor** (0): Consider fixing -- minor accessibility improvements

---

## Page Load Performance

| Page | URL | Load Time (ms) |
|------|-----|-----------------|
| Homepage | https://the-internet.herokuapp.com/ | 1603ms |
| Login Page | https://the-internet.herokuapp.com/login | 782ms |
| Checkboxes Page | https://the-internet.herokuapp.com/checkboxes | 679ms |
| Dropdown Page | https://the-internet.herokuapp.com/dropdown | 667ms |
| Dynamic Loading Page | https://the-internet.herokuapp.com/dynamic_loading | 664ms |
| Tables Page | https://the-internet.herokuapp.com/tables | 787ms |

---

## Homepage

**URL**: https://the-internet.herokuapp.com/
**Screenshot**: `the-internet-homepage.png`
**Load Time**: 1603ms
**Page Title**: The Internet
**Language**: en

### Page Statistics

| Metric | Value |
|--------|-------|
| Images | 1 (0 missing alt) |
| Form Inputs | 0 (0 missing labels) |
| Links | 46 (0 empty) |
| Tables | 0 |
| ARIA Roles | 0 |
| Headings | 2 |
| Contrast Sampled | 0 (0 failed) |

### Heading Structure

```
h1: Welcome to the-internet
  h2: Available Examples
```

### Landmarks

| Landmark | Count |
|----------|-------|
| main | 0 |
| nav | 0 |
| banner/header | 0 |
| contentinfo/footer | 0 |

### Violations (1)

#### [MODERATE] 1.3.1 Info and Relationships (Level A)

**Description**: Missing landmark regions

**Details**:
- No <main> landmark
- No <nav> landmark
- No <header>/<banner> landmark
- No <footer>/<contentinfo> landmark

**Remediation**:
Add semantic HTML5 landmark elements: `<main>`, `<nav>`, `<header>`, `<footer>`.

```html
<!-- Wrap main content -->
<main>
  <!-- page content here -->
</main>
```

---

## Login Page

**URL**: https://the-internet.herokuapp.com/login
**Screenshot**: `the-internet-login.png`
**Load Time**: 782ms
**Page Title**: The Internet
**Language**: en

### Page Statistics

| Metric | Value |
|--------|-------|
| Images | 1 (0 missing alt) |
| Form Inputs | 2 (0 missing labels) |
| Links | 2 (0 empty) |
| Tables | 0 |
| ARIA Roles | 0 |
| Headings | 2 |
| Contrast Sampled | 1 (1 failed) |

### Heading Structure

```
  h2: Login Page
      h4: This is where you can log into the secure area. Enter tomsmith for the username 
```

### Landmarks

| Landmark | Count |
|----------|-------|
| main | 0 |
| nav | 0 |
| banner/header | 0 |
| contentinfo/footer | 0 |

### Violations (3)

#### [MODERATE] 1.3.1 Info and Relationships / 2.4.6 Headings and Labels (Level AA)

**Description**: Heading hierarchy issues

**Details**:
- No h1 element found on the page
- Heading level skipped: h2 -> h4 ("This is where you can log into the secure area. Enter tomsmith for the username ")

**Remediation**:
Ensure heading levels are sequential (h1 -> h2 -> h3) without skipping levels.

#### [MODERATE] 1.3.1 Info and Relationships (Level A)

**Description**: Missing landmark regions

**Details**:
- No <main> landmark
- No <nav> landmark
- No <header>/<banner> landmark
- No <footer>/<contentinfo> landmark

**Remediation**:
Add semantic HTML5 landmark elements: `<main>`, `<nav>`, `<header>`, `<footer>`.

```html
<!-- Wrap main content -->
<main>
  <!-- page content here -->
</main>
```

#### [SERIOUS] 1.4.3 Contrast Minimum (Level AA)

**Description**: 1 text element(s) with insufficient color contrast (sampled 1)

**Affected Elements**:

```html
{"text":"Login","tag":"button","ratio":"2.83","required":"4.5","fg":"rgb(255, 255, 255)","bg":"rgb(43, 166, 203)"}
```

**Remediation**:
Ensure text has a contrast ratio of at least 4.5:1 (3:1 for large text). Use a contrast checker tool.

- Element `<button>` "Login": ratio 2.83:1 (need 4.5:1), fg: rgb(255, 255, 255), bg: rgb(43, 166, 203)

---

## Checkboxes Page

**URL**: https://the-internet.herokuapp.com/checkboxes
**Screenshot**: `the-internet-checkboxes.png`
**Load Time**: 679ms
**Page Title**: The Internet
**Language**: en

### Page Statistics

| Metric | Value |
|--------|-------|
| Images | 1 (0 missing alt) |
| Form Inputs | 2 (2 missing labels) |
| Links | 2 (0 empty) |
| Tables | 0 |
| ARIA Roles | 0 |
| Headings | 1 |
| Contrast Sampled | 0 (0 failed) |

### Heading Structure

```
    h3: Checkboxes
```

### Landmarks

| Landmark | Count |
|----------|-------|
| main | 0 |
| nav | 0 |
| banner/header | 0 |
| contentinfo/footer | 0 |

### Violations (3)

#### [CRITICAL] 1.3.1 Info and Relationships / 4.1.2 Name, Role, Value (Level A)

**Description**: 2 form input(s) missing accessible label

**Affected Elements**:

```html
<input type="checkbox" style="">
<input type="checkbox" checked="" style="">
```

**Remediation**:
Associate labels with form inputs using `for`/`id` or wrap inputs in `<label>` elements.

```html
<!-- Before -->
<input type="text" id="username">

<!-- After -->
<label for="username">Username</label>
<input type="text" id="username">
```

#### [MODERATE] 1.3.1 Info and Relationships / 2.4.6 Headings and Labels (Level AA)

**Description**: Heading hierarchy issues

**Details**:
- No h1 element found on the page

**Remediation**:
Ensure heading levels are sequential (h1 -> h2 -> h3) without skipping levels.

#### [MODERATE] 1.3.1 Info and Relationships (Level A)

**Description**: Missing landmark regions

**Details**:
- No <main> landmark
- No <nav> landmark
- No <header>/<banner> landmark
- No <footer>/<contentinfo> landmark

**Remediation**:
Add semantic HTML5 landmark elements: `<main>`, `<nav>`, `<header>`, `<footer>`.

```html
<!-- Wrap main content -->
<main>
  <!-- page content here -->
</main>
```

---

## Dropdown Page

**URL**: https://the-internet.herokuapp.com/dropdown
**Screenshot**: `the-internet-dropdown.png`
**Load Time**: 667ms
**Page Title**: The Internet
**Language**: en

### Page Statistics

| Metric | Value |
|--------|-------|
| Images | 1 (0 missing alt) |
| Form Inputs | 1 (1 missing labels) |
| Links | 2 (0 empty) |
| Tables | 0 |
| ARIA Roles | 0 |
| Headings | 1 |
| Contrast Sampled | 0 (0 failed) |

### Heading Structure

```
    h3: Dropdown List
```

### Landmarks

| Landmark | Count |
|----------|-------|
| main | 0 |
| nav | 0 |
| banner/header | 0 |
| contentinfo/footer | 0 |

### Violations (3)

#### [CRITICAL] 1.3.1 Info and Relationships / 4.1.2 Name, Role, Value (Level A)

**Description**: 1 form input(s) missing accessible label

**Affected Elements**:

```html
<select id="dropdown">
    <option value="" disabled="disabled" selected="selected">Please select an option</option>
   
```

**Remediation**:
Associate labels with form inputs using `for`/`id` or wrap inputs in `<label>` elements.

```html
<!-- Before -->
<input type="text" id="username">

<!-- After -->
<label for="username">Username</label>
<input type="text" id="username">
```

#### [MODERATE] 1.3.1 Info and Relationships / 2.4.6 Headings and Labels (Level AA)

**Description**: Heading hierarchy issues

**Details**:
- No h1 element found on the page

**Remediation**:
Ensure heading levels are sequential (h1 -> h2 -> h3) without skipping levels.

#### [MODERATE] 1.3.1 Info and Relationships (Level A)

**Description**: Missing landmark regions

**Details**:
- No <main> landmark
- No <nav> landmark
- No <header>/<banner> landmark
- No <footer>/<contentinfo> landmark

**Remediation**:
Add semantic HTML5 landmark elements: `<main>`, `<nav>`, `<header>`, `<footer>`.

```html
<!-- Wrap main content -->
<main>
  <!-- page content here -->
</main>
```

---

## Dynamic Loading Page

**URL**: https://the-internet.herokuapp.com/dynamic_loading
**Screenshot**: `the-internet-dynamic_loading.png`
**Load Time**: 664ms
**Page Title**: The Internet
**Language**: en

### Page Statistics

| Metric | Value |
|--------|-------|
| Images | 1 (0 missing alt) |
| Form Inputs | 0 (0 missing labels) |
| Links | 4 (0 empty) |
| Tables | 0 |
| ARIA Roles | 0 |
| Headings | 1 |
| Contrast Sampled | 0 (0 failed) |

### Heading Structure

```
    h3: Dynamically Loaded Page Elements
```

### Landmarks

| Landmark | Count |
|----------|-------|
| main | 0 |
| nav | 0 |
| banner/header | 0 |
| contentinfo/footer | 0 |

### Violations (2)

#### [MODERATE] 1.3.1 Info and Relationships / 2.4.6 Headings and Labels (Level AA)

**Description**: Heading hierarchy issues

**Details**:
- No h1 element found on the page

**Remediation**:
Ensure heading levels are sequential (h1 -> h2 -> h3) without skipping levels.

#### [MODERATE] 1.3.1 Info and Relationships (Level A)

**Description**: Missing landmark regions

**Details**:
- No <main> landmark
- No <nav> landmark
- No <header>/<banner> landmark
- No <footer>/<contentinfo> landmark

**Remediation**:
Add semantic HTML5 landmark elements: `<main>`, `<nav>`, `<header>`, `<footer>`.

```html
<!-- Wrap main content -->
<main>
  <!-- page content here -->
</main>
```

---

## Tables Page

**URL**: https://the-internet.herokuapp.com/tables
**Screenshot**: `the-internet-tables.png`
**Load Time**: 787ms
**Page Title**: The Internet
**Language**: en

### Page Statistics

| Metric | Value |
|--------|-------|
| Images | 1 (0 missing alt) |
| Form Inputs | 0 (0 missing labels) |
| Links | 18 (0 empty) |
| Tables | 2 |
| ARIA Roles | 0 |
| Headings | 3 |
| Contrast Sampled | 0 (0 failed) |

### Heading Structure

```
    h3: Data Tables
      h4: Example 1
      h4: Example 2
```

### Landmarks

| Landmark | Count |
|----------|-------|
| main | 0 |
| nav | 0 |
| banner/header | 0 |
| contentinfo/footer | 0 |

### Violations (3)

#### [MODERATE] 1.3.1 Info and Relationships / 2.4.6 Headings and Labels (Level AA)

**Description**: Heading hierarchy issues

**Details**:
- No h1 element found on the page

**Remediation**:
Ensure heading levels are sequential (h1 -> h2 -> h3) without skipping levels.

#### [MODERATE] 1.3.1 Info and Relationships (Level A)

**Description**: Missing landmark regions

**Details**:
- No <main> landmark
- No <nav> landmark
- No <header>/<banner> landmark
- No <footer>/<contentinfo> landmark

**Remediation**:
Add semantic HTML5 landmark elements: `<main>`, `<nav>`, `<header>`, `<footer>`.

```html
<!-- Wrap main content -->
<main>
  <!-- page content here -->
</main>
```

#### [MODERATE] 1.3.1 Info and Relationships (Level A)

**Description**: Table accessibility issues

**Details**:
- Table 1: <th> elements missing scope attribute
- Table 1: No <caption> element
- Table 2: <th> elements missing scope attribute
- Table 2: No <caption> element

**Remediation**:
Add `scope` attributes to `<th>` elements and include a `<caption>` for each table.

```html
<table>
  <caption>Data Table Description</caption>
  <thead>
    <tr><th scope="col">Header</th></tr>
  </thead>
</table>
```

---

## WCAG Criteria Checked

| # | Criterion | Level | Check Type |
|---|-----------|-------|------------|
| 1 | 1.1.1 Non-text Content | A | Images missing alt |
| 2 | 1.3.1 Info and Relationships | A | Labels, headings, landmarks, tables |
| 3 | 1.4.3 Contrast (Minimum) | AA | Text color contrast ratio |
| 4 | 2.4.2 Page Titled | A | Page title presence |
| 5 | 2.4.3 Focus Order | A | Positive tabindex misuse |
| 6 | 2.4.4 Link Purpose | A | Links with discernible text |
| 7 | 2.4.6 Headings and Labels | AA | Heading hierarchy |
| 8 | 3.1.1 Language of Page | A | html lang attribute |
| 9 | 4.1.2 Name, Role, Value | A | ARIA roles, buttons, form inputs |

---

## Methodology

This audit was performed using automated browser-based analysis with Playwright and Chromium.
Each page was loaded in headless Chromium, and JavaScript-based DOM inspection was used to check
12 categories of accessibility issues across 9 WCAG 2.1/2.2 success criteria.

**Limitations**:
- Color contrast checks use computed styles and may not account for background images/gradients
- Screen reader behavior is not tested (would require NVDA/VoiceOver integration)
- Dynamic content loaded after initial page render may not be fully audited
- Keyboard trap detection requires interactive testing beyond automated checks

---

*Report generated by AQE v3 Accessibility Auditor on 2026-02-16T10:14:52.659Z*
