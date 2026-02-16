/**
 * Comprehensive WCAG Accessibility Audit Script
 * Uses Playwright with Chromium to audit https://the-internet.herokuapp.com/
 * Checks: alt text, labels, contrast, heading hierarchy, ARIA roles, keyboard nav, forms
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://the-internet.herokuapp.com';
const RESULTS_DIR = '/workspaces/cf-devpod/docs/demos/results';

const PAGES = [
  { path: '/', name: 'Homepage' },
  { path: '/login', name: 'Login Page' },
  { path: '/checkboxes', name: 'Checkboxes Page' },
  { path: '/dropdown', name: 'Dropdown Page' },
  { path: '/dynamic_loading', name: 'Dynamic Loading Page' },
  { path: '/tables', name: 'Tables Page' },
];

// In-page accessibility checks executed in the browser context
async function runA11yChecks(page, pageName) {
  return await page.evaluate((pageName) => {
    const issues = [];
    const info = {};

    // --- 1. Images missing alt text (WCAG 1.1.1) ---
    const images = document.querySelectorAll('img');
    const imgsMissingAlt = [];
    images.forEach((img) => {
      const alt = img.getAttribute('alt');
      if (alt === null || alt === undefined) {
        imgsMissingAlt.push({ src: img.src || '(no src)', outerHTML: img.outerHTML.substring(0, 120) });
      }
    });
    if (imgsMissingAlt.length > 0) {
      issues.push({
        wcag: '1.1.1 Non-text Content (Level A)',
        severity: 'critical',
        description: `${imgsMissingAlt.length} image(s) missing alt attribute`,
        elements: imgsMissingAlt,
      });
    }
    info.totalImages = images.length;
    info.imagesMissingAlt = imgsMissingAlt.length;

    // --- 2. Form inputs missing labels (WCAG 1.3.1, 4.1.2) ---
    const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea');
    const inputsMissingLabels = [];
    inputs.forEach((input) => {
      const id = input.id;
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledby = input.getAttribute('aria-labelledby');
      const title = input.getAttribute('title');
      const placeholder = input.getAttribute('placeholder');
      let hasLabel = false;
      if (id) {
        hasLabel = !!document.querySelector(`label[for="${id}"]`);
      }
      if (!hasLabel) {
        // Check if wrapped in a label
        hasLabel = !!input.closest('label');
      }
      if (!hasLabel && !ariaLabel && !ariaLabelledby && !title) {
        inputsMissingLabels.push({
          tag: input.tagName.toLowerCase(),
          type: input.type || '',
          id: input.id || '',
          name: input.name || '',
          placeholder: placeholder || '',
          outerHTML: input.outerHTML.substring(0, 120),
        });
      }
    });
    if (inputsMissingLabels.length > 0) {
      issues.push({
        wcag: '1.3.1 Info and Relationships / 4.1.2 Name, Role, Value (Level A)',
        severity: 'critical',
        description: `${inputsMissingLabels.length} form input(s) missing accessible label`,
        elements: inputsMissingLabels,
      });
    }
    info.totalInputs = inputs.length;
    info.inputsMissingLabels = inputsMissingLabels.length;

    // --- 3. Heading hierarchy (WCAG 1.3.1, 2.4.6) ---
    const headings = [];
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
      headings.push({
        level: parseInt(h.tagName[1]),
        text: h.textContent.trim().substring(0, 80),
      });
    });
    const headingIssues = [];
    // Check: no h1
    const h1Count = headings.filter((h) => h.level === 1).length;
    if (h1Count === 0) {
      headingIssues.push('No h1 element found on the page');
    }
    if (h1Count > 1) {
      headingIssues.push(`Multiple h1 elements found (${h1Count})`);
    }
    // Check skipped levels
    for (let i = 1; i < headings.length; i++) {
      if (headings[i].level > headings[i - 1].level + 1) {
        headingIssues.push(
          `Heading level skipped: h${headings[i - 1].level} -> h${headings[i].level} ("${headings[i].text}")`
        );
      }
    }
    if (headingIssues.length > 0) {
      issues.push({
        wcag: '1.3.1 Info and Relationships / 2.4.6 Headings and Labels (Level AA)',
        severity: 'moderate',
        description: 'Heading hierarchy issues',
        details: headingIssues,
      });
    }
    info.headings = headings;
    info.headingIssues = headingIssues.length;

    // --- 4. ARIA roles validation (WCAG 4.1.2) ---
    const ariaIssues = [];
    const elementsWithRole = document.querySelectorAll('[role]');
    const validRoles = [
      'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
      'cell', 'checkbox', 'columnheader', 'combobox', 'complementary',
      'contentinfo', 'definition', 'dialog', 'directory', 'document', 'feed',
      'figure', 'form', 'grid', 'gridcell', 'group', 'heading', 'img',
      'link', 'list', 'listbox', 'listitem', 'log', 'main', 'marquee',
      'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox',
      'menuitemradio', 'navigation', 'none', 'note', 'option', 'presentation',
      'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup',
      'rowheader', 'scrollbar', 'search', 'searchbox', 'separator', 'slider',
      'spinbutton', 'status', 'switch', 'tab', 'table', 'tablist', 'tabpanel',
      'term', 'textbox', 'timer', 'toolbar', 'tooltip', 'tree', 'treegrid',
      'treeitem',
    ];
    elementsWithRole.forEach((el) => {
      const role = el.getAttribute('role');
      if (!validRoles.includes(role)) {
        ariaIssues.push({ role, element: el.outerHTML.substring(0, 100) });
      }
    });
    // Check for aria-* attributes on elements that lack proper roles
    const ariaAttrs = document.querySelectorAll('[aria-labelledby]');
    ariaAttrs.forEach((el) => {
      const ids = el.getAttribute('aria-labelledby').split(/\s+/);
      ids.forEach((id) => {
        if (!document.getElementById(id)) {
          ariaIssues.push({
            issue: `aria-labelledby references missing ID: "${id}"`,
            element: el.outerHTML.substring(0, 100),
          });
        }
      });
    });
    if (ariaIssues.length > 0) {
      issues.push({
        wcag: '4.1.2 Name, Role, Value (Level A)',
        severity: 'serious',
        description: `${ariaIssues.length} ARIA issue(s) found`,
        elements: ariaIssues,
      });
    }
    info.ariaRoleCount = elementsWithRole.length;
    info.ariaIssues = ariaIssues.length;

    // --- 5. Links without discernible text (WCAG 2.4.4) ---
    const links = document.querySelectorAll('a');
    const emptyLinks = [];
    links.forEach((a) => {
      const text = a.textContent.trim();
      const ariaLabel = a.getAttribute('aria-label');
      const ariaLabelledby = a.getAttribute('aria-labelledby');
      const title = a.getAttribute('title');
      const img = a.querySelector('img[alt]');
      if (!text && !ariaLabel && !ariaLabelledby && !title && !img) {
        emptyLinks.push({ href: a.href || '', outerHTML: a.outerHTML.substring(0, 120) });
      }
    });
    if (emptyLinks.length > 0) {
      issues.push({
        wcag: '2.4.4 Link Purpose (Level A)',
        severity: 'serious',
        description: `${emptyLinks.length} link(s) without discernible text`,
        elements: emptyLinks,
      });
    }
    info.totalLinks = links.length;
    info.emptyLinks = emptyLinks.length;

    // --- 6. Document language (WCAG 3.1.1) ---
    const lang = document.documentElement.getAttribute('lang');
    if (!lang) {
      issues.push({
        wcag: '3.1.1 Language of Page (Level A)',
        severity: 'serious',
        description: 'Page is missing a lang attribute on the <html> element',
        elements: [],
      });
    }
    info.lang = lang || '(missing)';

    // --- 7. Page title (WCAG 2.4.2) ---
    const title_val = document.title;
    if (!title_val || title_val.trim() === '') {
      issues.push({
        wcag: '2.4.2 Page Titled (Level A)',
        severity: 'serious',
        description: 'Page is missing a <title> element',
        elements: [],
      });
    }
    info.pageTitle = title_val || '(missing)';

    // --- 8. Landmark regions (WCAG 1.3.1) ---
    const landmarks = {
      main: document.querySelectorAll('main, [role="main"]').length,
      nav: document.querySelectorAll('nav, [role="navigation"]').length,
      banner: document.querySelectorAll('header, [role="banner"]').length,
      contentinfo: document.querySelectorAll('footer, [role="contentinfo"]').length,
    };
    const landmarkIssues = [];
    if (landmarks.main === 0) landmarkIssues.push('No <main> landmark');
    if (landmarks.nav === 0) landmarkIssues.push('No <nav> landmark');
    if (landmarks.banner === 0) landmarkIssues.push('No <header>/<banner> landmark');
    if (landmarks.contentinfo === 0) landmarkIssues.push('No <footer>/<contentinfo> landmark');
    if (landmarkIssues.length > 0) {
      issues.push({
        wcag: '1.3.1 Info and Relationships (Level A)',
        severity: 'moderate',
        description: 'Missing landmark regions',
        details: landmarkIssues,
      });
    }
    info.landmarks = landmarks;

    // --- 9. Tab index misuse (WCAG 2.4.3) ---
    const positiveTabindex = document.querySelectorAll('[tabindex]');
    const badTabindex = [];
    positiveTabindex.forEach((el) => {
      const val = parseInt(el.getAttribute('tabindex'));
      if (val > 0) {
        badTabindex.push({ tabindex: val, element: el.outerHTML.substring(0, 100) });
      }
    });
    if (badTabindex.length > 0) {
      issues.push({
        wcag: '2.4.3 Focus Order (Level A)',
        severity: 'moderate',
        description: `${badTabindex.length} element(s) with positive tabindex (disrupts natural tab order)`,
        elements: badTabindex,
      });
    }
    info.positiveTabindex = badTabindex.length;

    // --- 10. Tables missing headers (WCAG 1.3.1) ---
    const tables = document.querySelectorAll('table');
    const tableIssues = [];
    tables.forEach((table, idx) => {
      const ths = table.querySelectorAll('th');
      const caption = table.querySelector('caption');
      const scope = table.querySelectorAll('th[scope]');
      if (ths.length === 0) {
        tableIssues.push(`Table ${idx + 1}: No <th> header cells found`);
      }
      if (ths.length > 0 && scope.length === 0) {
        tableIssues.push(`Table ${idx + 1}: <th> elements missing scope attribute`);
      }
      if (!caption) {
        tableIssues.push(`Table ${idx + 1}: No <caption> element`);
      }
    });
    if (tableIssues.length > 0) {
      issues.push({
        wcag: '1.3.1 Info and Relationships (Level A)',
        severity: 'moderate',
        description: 'Table accessibility issues',
        details: tableIssues,
      });
    }
    info.tableCount = tables.length;
    info.tableIssues = tableIssues.length;

    // --- 11. Color contrast estimation (WCAG 1.4.3) ---
    // We sample key text elements and check computed styles
    const contrastIssues = [];
    function luminance(r, g, b) {
      const a = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }
    function parseColor(str) {
      const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (m) return { r: +m[1], g: +m[2], b: +m[3] };
      return null;
    }
    function contrastRatio(c1, c2) {
      const l1 = luminance(c1.r, c1.g, c1.b);
      const l2 = luminance(c2.r, c2.g, c2.b);
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    }
    const textElements = document.querySelectorAll('h1, h2, h3, h4, p, a, label, span, li, td, th, button');
    let sampledCount = 0;
    let failCount = 0;
    textElements.forEach((el) => {
      if (sampledCount > 50) return; // sample limit
      const style = window.getComputedStyle(el);
      const fg = parseColor(style.color);
      const bg = parseColor(style.backgroundColor);
      if (fg && bg && !(bg.r === 0 && bg.g === 0 && bg.b === 0 && style.backgroundColor.includes('0)'))) {
        sampledCount++;
        const ratio = contrastRatio(fg, bg);
        const fontSize = parseFloat(style.fontSize);
        const fontWeight = parseInt(style.fontWeight) || 400;
        const isLargeText = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
        const threshold = isLargeText ? 3.0 : 4.5;
        if (ratio < threshold) {
          failCount++;
          if (failCount <= 5) {
            contrastIssues.push({
              text: el.textContent.trim().substring(0, 40),
              tag: el.tagName.toLowerCase(),
              ratio: ratio.toFixed(2),
              required: threshold.toFixed(1),
              fg: style.color,
              bg: style.backgroundColor,
            });
          }
        }
      }
    });
    if (contrastIssues.length > 0) {
      issues.push({
        wcag: '1.4.3 Contrast Minimum (Level AA)',
        severity: 'serious',
        description: `${failCount} text element(s) with insufficient color contrast (sampled ${sampledCount})`,
        elements: contrastIssues,
      });
    }
    info.contrastSampled = sampledCount;
    info.contrastFailed = failCount;

    // --- 12. Buttons without accessible names (WCAG 4.1.2) ---
    const buttons = document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"]');
    const unlabeledButtons = [];
    buttons.forEach((btn) => {
      const text = btn.textContent.trim();
      const ariaLabel = btn.getAttribute('aria-label');
      const value = btn.value;
      const title = btn.getAttribute('title');
      if (!text && !ariaLabel && !value && !title) {
        unlabeledButtons.push({ outerHTML: btn.outerHTML.substring(0, 120) });
      }
    });
    if (unlabeledButtons.length > 0) {
      issues.push({
        wcag: '4.1.2 Name, Role, Value (Level A)',
        severity: 'critical',
        description: `${unlabeledButtons.length} button(s) without accessible name`,
        elements: unlabeledButtons,
      });
    }

    return { pageName, issues, info };
  }, pageName);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  const allResults = [];
  const loadTimes = [];

  for (const pg of PAGES) {
    const page = await context.newPage();
    const url = BASE_URL + pg.path;
    console.log(`Auditing: ${pg.name} (${url})`);

    const startTime = Date.now();
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    } catch (e) {
      // Fallback to domcontentloaded
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      } catch (e2) {
        console.error(`  Failed to load ${url}: ${e2.message}`);
        allResults.push({ pageName: pg.name, url, error: e2.message, issues: [], info: {} });
        loadTimes.push({ page: pg.name, url, time: -1 });
        await page.close();
        continue;
      }
    }
    const loadTime = Date.now() - startTime;
    loadTimes.push({ page: pg.name, url, time: loadTime });
    console.log(`  Loaded in ${loadTime}ms`);

    // Screenshot
    const screenshotName = pg.path === '/' ? 'the-internet-homepage.png' : `the-internet${pg.path.replace(/\//g, '-')}.png`;
    await page.screenshot({ path: path.join(RESULTS_DIR, screenshotName), fullPage: true });
    console.log(`  Screenshot: ${screenshotName}`);

    // Run checks
    const result = await runA11yChecks(page, pg.name);
    result.url = url;
    result.loadTime = loadTime;
    result.screenshot = screenshotName;
    allResults.push(result);
    console.log(`  Issues found: ${result.issues.length}`);

    await page.close();
  }

  await browser.close();

  // --- Generate Markdown Report ---
  const now = new Date().toISOString();
  let totalViolations = 0;
  let criticalCount = 0;
  let seriousCount = 0;
  let moderateCount = 0;
  let minorCount = 0;

  allResults.forEach((r) => {
    (r.issues || []).forEach((issue) => {
      totalViolations++;
      if (issue.severity === 'critical') criticalCount++;
      else if (issue.severity === 'serious') seriousCount++;
      else if (issue.severity === 'moderate') moderateCount++;
      else minorCount++;
    });
  });

  // Calculate compliance score
  const maxScore = allResults.length * 12; // 12 checks per page
  const deductions = criticalCount * 3 + seriousCount * 2 + moderateCount * 1 + minorCount * 0.5;
  const complianceScore = Math.max(0, Math.round(((maxScore - deductions) / maxScore) * 100));

  let md = `# WCAG Accessibility Audit Report

**Target**: ${BASE_URL}
**Date**: ${now}
**Standard**: WCAG 2.1/2.2 Level AA
**Tool**: Playwright ${require('playwright/package.json').version} + Chromium (headless)
**Auditor**: AQE v3 Accessibility Auditor

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Pages Audited | ${allResults.length} |
| Total Violations | ${totalViolations} |
| Critical | ${criticalCount} |
| Serious | ${seriousCount} |
| Moderate | ${moderateCount} |
| Minor | ${minorCount} |
| Compliance Score | ${complianceScore}% |

### Violations by Severity

- **Critical** (${criticalCount}): Must fix immediately -- blocks access for users with disabilities
- **Serious** (${seriousCount}): Should fix urgently -- significantly impacts accessibility
- **Moderate** (${moderateCount}): Should fix -- degrades accessibility experience
- **Minor** (${minorCount}): Consider fixing -- minor accessibility improvements

---

## Page Load Performance

| Page | URL | Load Time (ms) |
|------|-----|-----------------|
`;

  loadTimes.forEach((lt) => {
    md += `| ${lt.page} | ${lt.url} | ${lt.time === -1 ? 'FAILED' : lt.time + 'ms'} |\n`;
  });

  md += `\n---\n\n`;

  // Per-page results
  for (const result of allResults) {
    md += `## ${result.pageName}\n\n`;
    md += `**URL**: ${result.url}\n`;
    md += `**Screenshot**: \`${result.screenshot}\`\n`;
    md += `**Load Time**: ${result.loadTime}ms\n`;

    if (result.error) {
      md += `**ERROR**: ${result.error}\n\n`;
      continue;
    }

    const info = result.info || {};
    md += `**Page Title**: ${info.pageTitle || '(unknown)'}\n`;
    md += `**Language**: ${info.lang || '(unknown)'}\n\n`;

    // Page stats
    md += `### Page Statistics\n\n`;
    md += `| Metric | Value |\n|--------|-------|\n`;
    md += `| Images | ${info.totalImages || 0} (${info.imagesMissingAlt || 0} missing alt) |\n`;
    md += `| Form Inputs | ${info.totalInputs || 0} (${info.inputsMissingLabels || 0} missing labels) |\n`;
    md += `| Links | ${info.totalLinks || 0} (${info.emptyLinks || 0} empty) |\n`;
    md += `| Tables | ${info.tableCount || 0} |\n`;
    md += `| ARIA Roles | ${info.ariaRoleCount || 0} |\n`;
    md += `| Headings | ${(info.headings || []).length} |\n`;
    md += `| Contrast Sampled | ${info.contrastSampled || 0} (${info.contrastFailed || 0} failed) |\n`;
    md += `\n`;

    // Heading structure
    if (info.headings && info.headings.length > 0) {
      md += `### Heading Structure\n\n`;
      md += '```\n';
      info.headings.forEach((h) => {
        md += `${'  '.repeat(h.level - 1)}h${h.level}: ${h.text}\n`;
      });
      md += '```\n\n';
    }

    // Landmarks
    if (info.landmarks) {
      md += `### Landmarks\n\n`;
      md += `| Landmark | Count |\n|----------|-------|\n`;
      md += `| main | ${info.landmarks.main} |\n`;
      md += `| nav | ${info.landmarks.nav} |\n`;
      md += `| banner/header | ${info.landmarks.banner} |\n`;
      md += `| contentinfo/footer | ${info.landmarks.contentinfo} |\n\n`;
    }

    // Issues
    if (result.issues && result.issues.length > 0) {
      md += `### Violations (${result.issues.length})\n\n`;
      for (const issue of result.issues) {
        const severityBadge =
          issue.severity === 'critical' ? '[CRITICAL]' :
          issue.severity === 'serious' ? '[SERIOUS]' :
          issue.severity === 'moderate' ? '[MODERATE]' : '[MINOR]';

        md += `#### ${severityBadge} ${issue.wcag}\n\n`;
        md += `**Description**: ${issue.description}\n\n`;

        if (issue.details) {
          md += `**Details**:\n`;
          issue.details.forEach((d) => {
            md += `- ${d}\n`;
          });
          md += `\n`;
        }

        if (issue.elements && issue.elements.length > 0) {
          md += `**Affected Elements**:\n\n`;
          md += '```html\n';
          issue.elements.forEach((el) => {
            if (el.outerHTML) md += `${el.outerHTML}\n`;
            else if (el.issue) md += `${el.issue}\n`;
            else md += `${JSON.stringify(el)}\n`;
          });
          md += '```\n\n';
        }

        // Add remediation
        md += `**Remediation**:\n`;
        if (issue.wcag.includes('1.1.1')) {
          md += `Add descriptive \`alt\` attributes to all \`<img>\` elements. Use \`alt=""\` for decorative images.\n\n`;
          md += '```html\n<!-- Before -->\n<img src="image.jpg">\n\n<!-- After -->\n<img src="image.jpg" alt="Description of the image content">\n```\n\n';
        } else if (issue.wcag.includes('1.3.1') && issue.description.includes('label')) {
          md += `Associate labels with form inputs using \`for\`/\`id\` or wrap inputs in \`<label>\` elements.\n\n`;
          md += '```html\n<!-- Before -->\n<input type="text" id="username">\n\n<!-- After -->\n<label for="username">Username</label>\n<input type="text" id="username">\n```\n\n';
        } else if (issue.wcag.includes('1.3.1') && issue.description.includes('landmark')) {
          md += `Add semantic HTML5 landmark elements: \`<main>\`, \`<nav>\`, \`<header>\`, \`<footer>\`.\n\n`;
          md += '```html\n<!-- Wrap main content -->\n<main>\n  <!-- page content here -->\n</main>\n```\n\n';
        } else if (issue.wcag.includes('1.3.1') && issue.description.includes('Table')) {
          md += `Add \`scope\` attributes to \`<th>\` elements and include a \`<caption>\` for each table.\n\n`;
          md += '```html\n<table>\n  <caption>Data Table Description</caption>\n  <thead>\n    <tr><th scope="col">Header</th></tr>\n  </thead>\n</table>\n```\n\n';
        } else if (issue.wcag.includes('1.3.1') && issue.description.includes('Heading')) {
          md += `Ensure heading levels are sequential (h1 -> h2 -> h3) without skipping levels.\n\n`;
        } else if (issue.wcag.includes('1.4.3')) {
          md += `Ensure text has a contrast ratio of at least 4.5:1 (3:1 for large text). Use a contrast checker tool.\n\n`;
          if (issue.elements && issue.elements.length > 0) {
            issue.elements.forEach((el) => {
              md += `- Element \`<${el.tag}>\` "${el.text}": ratio ${el.ratio}:1 (need ${el.required}:1), fg: ${el.fg}, bg: ${el.bg}\n`;
            });
            md += `\n`;
          }
        } else if (issue.wcag.includes('2.4.4')) {
          md += `Add descriptive text content, \`aria-label\`, or \`title\` to all links.\n\n`;
          md += '```html\n<!-- Before -->\n<a href="/page"><img src="icon.png"></a>\n\n<!-- After -->\n<a href="/page" aria-label="Go to page"><img src="icon.png" alt=""></a>\n```\n\n';
        } else if (issue.wcag.includes('3.1.1')) {
          md += `Add a \`lang\` attribute to the \`<html>\` element.\n\n`;
          md += '```html\n<html lang="en">\n```\n\n';
        } else if (issue.wcag.includes('2.4.2')) {
          md += `Add a descriptive \`<title>\` element to the page.\n\n`;
        } else if (issue.wcag.includes('4.1.2') && issue.description.includes('ARIA')) {
          md += `Fix invalid ARIA roles or missing referenced IDs.\n\n`;
        } else if (issue.wcag.includes('4.1.2') && issue.description.includes('button')) {
          md += `Add text content or \`aria-label\` to all buttons.\n\n`;
        } else if (issue.wcag.includes('2.4.3')) {
          md += `Remove positive \`tabindex\` values. Use \`tabindex="0"\` or \`tabindex="-1"\` only.\n\n`;
        } else {
          md += `Review and fix the affected elements per WCAG ${issue.wcag} guidelines.\n\n`;
        }
      }
    } else {
      md += `### No violations detected on this page.\n\n`;
    }

    md += `---\n\n`;
  }

  // Summary of all WCAG criteria checked
  md += `## WCAG Criteria Checked\n\n`;
  md += `| # | Criterion | Level | Check Type |\n`;
  md += `|---|-----------|-------|------------|\n`;
  md += `| 1 | 1.1.1 Non-text Content | A | Images missing alt |\n`;
  md += `| 2 | 1.3.1 Info and Relationships | A | Labels, headings, landmarks, tables |\n`;
  md += `| 3 | 1.4.3 Contrast (Minimum) | AA | Text color contrast ratio |\n`;
  md += `| 4 | 2.4.2 Page Titled | A | Page title presence |\n`;
  md += `| 5 | 2.4.3 Focus Order | A | Positive tabindex misuse |\n`;
  md += `| 6 | 2.4.4 Link Purpose | A | Links with discernible text |\n`;
  md += `| 7 | 2.4.6 Headings and Labels | AA | Heading hierarchy |\n`;
  md += `| 8 | 3.1.1 Language of Page | A | html lang attribute |\n`;
  md += `| 9 | 4.1.2 Name, Role, Value | A | ARIA roles, buttons, form inputs |\n`;
  md += `\n---\n\n`;

  md += `## Methodology\n\n`;
  md += `This audit was performed using automated browser-based analysis with Playwright and Chromium.\n`;
  md += `Each page was loaded in headless Chromium, and JavaScript-based DOM inspection was used to check\n`;
  md += `12 categories of accessibility issues across 9 WCAG 2.1/2.2 success criteria.\n\n`;
  md += `**Limitations**:\n`;
  md += `- Color contrast checks use computed styles and may not account for background images/gradients\n`;
  md += `- Screen reader behavior is not tested (would require NVDA/VoiceOver integration)\n`;
  md += `- Dynamic content loaded after initial page render may not be fully audited\n`;
  md += `- Keyboard trap detection requires interactive testing beyond automated checks\n\n`;

  md += `---\n\n`;
  md += `*Report generated by AQE v3 Accessibility Auditor on ${now}*\n`;

  fs.writeFileSync(path.join(RESULTS_DIR, 'the-internet-audit.md'), md);
  console.log(`\nReport saved to ${path.join(RESULTS_DIR, 'the-internet-audit.md')}`);

  // Also save raw JSON for further processing
  fs.writeFileSync(
    path.join(RESULTS_DIR, 'the-internet-audit.json'),
    JSON.stringify({ timestamp: now, results: allResults, loadTimes, summary: { totalViolations, criticalCount, seriousCount, moderateCount, minorCount, complianceScore } }, null, 2)
  );
  console.log(`JSON saved to ${path.join(RESULTS_DIR, 'the-internet-audit.json')}`);
})();
