import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';

const BASE_URL = 'https://agentic-qe.dev';
const OUTPUT_DIR = '/workspaces/cf-devpod/docs/aqe-website-analysis';
const SCREENSHOT_DIR = `${OUTPUT_DIR}/screenshots`;

mkdirSync(SCREENSHOT_DIR, { recursive: true });

const PAGES = [
  '/', '/framework', '/agents', '/playbook', '/contributors',
  '/assessment', '/integrations', '/migration', '/docs', '/skills',
  '/playbook/getting-started', '/playbook/assessment-guide',
  '/playbook/implementation-patterns', '/playbook/agent-design-patterns',
  '/playbook/orchestration-strategies', '/playbook/human-in-the-loop',
  '/playbook/v3-workflows', '/playbook/domain-driven-qe',
  '/playbook/model-routing', '/playbook/queen-orchestration',
  '/playbook/learning', '/playbook/browser-automation',
  '/playbook/fleet-configuration', '/playbook/migration',
  '/playbook/use-cases', '/playbook/tools-templates'
];

async function analyzePage(page, path) {
  const url = `${BASE_URL}${path}`;
  const slug = path === '/' ? 'home' : path.replace(/\//g, '-').substring(1);

  try {
    const startTime = Date.now();
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    const loadTime = Date.now() - startTime;
    await page.waitForTimeout(2000);

    // Screenshot
    await page.screenshot({ path: `${SCREENSHOT_DIR}/${slug}.png`, fullPage: true });

    // Mobile screenshot
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/${slug}-mobile.png`, fullPage: true });
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);

    const data = await page.evaluate(() => {
      // Content analysis
      const bodyText = document.body?.innerText || '';
      const h1s = [...document.querySelectorAll('h1')].map(h => h.textContent.trim());
      const h2s = [...document.querySelectorAll('h2')].map(h => h.textContent.trim());
      const h3s = [...document.querySelectorAll('h3')].map(h => h.textContent.trim());
      const paragraphs = [...document.querySelectorAll('p')].map(p => p.textContent.trim()).filter(Boolean);

      // Links analysis
      const allLinks = [...document.querySelectorAll('a[href]')];
      const internalLinks = allLinks.filter(a => a.href.includes('agentic-qe.dev')).map(a => ({
        href: a.href, text: a.textContent.trim(), hasTitle: !!a.title
      }));
      const externalLinks = allLinks.filter(a => !a.href.includes('agentic-qe.dev') && a.href.startsWith('http')).map(a => ({
        href: a.href, text: a.textContent.trim(), hasTarget: a.target === '_blank', hasRel: a.rel.includes('noopener')
      }));

      // Images analysis
      const images = [...document.querySelectorAll('img')].map(img => ({
        src: img.src, alt: img.alt, hasAlt: !!img.alt, width: img.naturalWidth, height: img.naturalHeight,
        loading: img.loading
      }));

      // Meta tags
      const meta = {};
      document.querySelectorAll('meta').forEach(m => {
        const name = m.getAttribute('name') || m.getAttribute('property');
        if (name) meta[name] = m.getAttribute('content');
      });

      // Accessibility checks
      const a11y = {
        hasLangAttr: !!document.documentElement.lang,
        lang: document.documentElement.lang,
        hasMainLandmark: !!document.querySelector('main'),
        hasNavLandmark: !!document.querySelector('nav'),
        hasFooter: !!document.querySelector('footer'),
        hasHeader: !!document.querySelector('header'),
        hasSkipLink: !!document.querySelector('a[href="#main"], a[href="#content"], .skip-link'),
        headingOrder: [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => ({
          level: parseInt(h.tagName[1]), text: h.textContent.trim().substring(0, 80)
        })),
        imagesWithoutAlt: [...document.querySelectorAll('img:not([alt])')].length,
        buttonsWithoutLabel: [...document.querySelectorAll('button')].filter(b => !b.textContent.trim() && !b.getAttribute('aria-label')).length,
        inputsWithoutLabel: [...document.querySelectorAll('input:not([type="hidden"])')].filter(i => {
          const id = i.id;
          return !i.getAttribute('aria-label') && !i.getAttribute('aria-labelledby') && !(id && document.querySelector(`label[for="${id}"]`));
        }).length,
        colorContrast: (() => {
          // Basic contrast check on key elements
          const issues = [];
          document.querySelectorAll('p, h1, h2, h3, a, button, span, li').forEach(el => {
            const style = window.getComputedStyle(el);
            const color = style.color;
            const bg = style.backgroundColor;
            if (color === bg && color !== 'rgba(0, 0, 0, 0)') {
              issues.push({ element: el.tagName, text: el.textContent.trim().substring(0, 50) });
            }
          });
          return issues;
        })(),
        focusableElements: document.querySelectorAll('a, button, input, select, textarea, [tabindex]').length,
        ariaRoles: [...new Set([...document.querySelectorAll('[role]')].map(el => el.getAttribute('role')))]
      };

      // Forms analysis
      const forms = [...document.querySelectorAll('form')].map(f => ({
        action: f.action, method: f.method,
        inputs: [...f.querySelectorAll('input, textarea, select')].map(i => ({
          type: i.type, name: i.name, required: i.required, hasLabel: !!i.getAttribute('aria-label') || !!document.querySelector(`label[for="${i.id}"]`)
        }))
      }));

      // Performance indicators
      const perf = {
        totalElements: document.querySelectorAll('*').length,
        totalScripts: document.querySelectorAll('script').length,
        totalStyles: document.querySelectorAll('link[rel="stylesheet"]').length + document.querySelectorAll('style').length,
        inlineStyles: document.querySelectorAll('[style]').length,
        totalImages: document.querySelectorAll('img').length,
        lazyImages: document.querySelectorAll('img[loading="lazy"]').length,
      };

      // SEO checks
      const seo = {
        hasTitle: !!document.title,
        titleLength: document.title.length,
        hasDescription: !!meta.description,
        descriptionLength: (meta.description || '').length,
        hasCanonical: !!document.querySelector('link[rel="canonical"]'),
        hasOgTags: !!(meta['og:title'] && meta['og:description']),
        hasTwitterCard: !!meta['twitter:card'],
        hasStructuredData: !!document.querySelector('script[type="application/ld+json"]'),
        h1Count: h1s.length,
        wordCount: bodyText.split(/\s+/).length
      };

      // Navigation consistency
      const nav = document.querySelector('nav')?.innerHTML || '';
      const footer = document.querySelector('footer')?.innerHTML || '';

      return {
        bodyText: bodyText.substring(0, 5000),
        h1s, h2s, h3s, paragraphs: paragraphs.slice(0, 20),
        internalLinks, externalLinks, images, meta,
        a11y, forms, perf, seo,
        navHash: nav.length,
        footerHash: footer.length
      };
    });

    return {
      url, path, slug, status: response?.status(),
      loadTime, title: await page.title(),
      ...data
    };
  } catch (err) {
    console.error(`✗ ${url}: ${err.message}`);
    return { url, path, slug, error: err.message };
  }
}

console.log('Starting full site analysis...');
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  viewport: { width: 1920, height: 1080 }
});
const page = await context.newPage();

const results = [];
for (const path of PAGES) {
  console.log(`Analyzing ${path}...`);
  const result = await analyzePage(page, path);
  results.push(result);
  console.log(`  ✓ ${result.title || result.error} (${result.loadTime || 0}ms)`);
}

await browser.close();

// Save full results
writeFileSync(`${OUTPUT_DIR}/raw-analysis.json`, JSON.stringify(results, null, 2));
console.log(`\nAnalysis complete. ${results.length} pages analyzed.`);
console.log(`Results saved to ${OUTPUT_DIR}/raw-analysis.json`);
