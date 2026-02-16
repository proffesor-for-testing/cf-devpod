import { chromium } from 'playwright';

const BASE_URL = 'https://agentic-qe.dev';
const visited = new Set();
const toVisit = [BASE_URL];
const pageData = {};

async function crawlPage(page, url) {
  if (visited.has(url)) return;
  visited.add(url);

  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    // Wait for Cloudflare challenge if present
    await page.waitForTimeout(3000);

    const status = response?.status() || 0;
    const title = await page.title();

    // Get page content and metadata
    const data = await page.evaluate(() => {
      const links = [...document.querySelectorAll('a[href]')].map(a => a.href);
      const h1s = [...document.querySelectorAll('h1')].map(h => h.textContent.trim());
      const h2s = [...document.querySelectorAll('h2')].map(h => h.textContent.trim());
      const images = [...document.querySelectorAll('img')].map(img => ({
        src: img.src,
        alt: img.alt || '',
        width: img.naturalWidth,
        height: img.naturalHeight
      }));
      const meta = {};
      document.querySelectorAll('meta').forEach(m => {
        const name = m.getAttribute('name') || m.getAttribute('property');
        if (name) meta[name] = m.getAttribute('content');
      });
      const forms = [...document.querySelectorAll('form')].length;
      const buttons = [...document.querySelectorAll('button')].length;
      const inputs = [...document.querySelectorAll('input, textarea, select')].length;
      const bodyText = document.body?.innerText?.substring(0, 2000) || '';
      const nav = document.querySelector('nav')?.innerText || '';
      const footer = document.querySelector('footer')?.innerText || '';

      return { links, h1s, h2s, images, meta, forms, buttons, inputs, bodyText, nav, footer };
    });

    pageData[url] = { status, title, ...data };

    // Find internal links to crawl
    for (const link of data.links) {
      try {
        const parsed = new URL(link);
        if (parsed.origin === BASE_URL && !visited.has(link) && !link.includes('#')) {
          const clean = link.split('?')[0].split('#')[0];
          if (!visited.has(clean)) {
            toVisit.push(clean);
          }
        }
      } catch {}
    }

    console.log(`✓ ${url} - "${title}" (${status})`);
  } catch (err) {
    console.error(`✗ ${url} - ${err.message}`);
    pageData[url] = { error: err.message };
  }
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  viewport: { width: 1920, height: 1080 }
});
const page = await context.newPage();

while (toVisit.length > 0) {
  const url = toVisit.shift();
  await crawlPage(page, url);
}

await browser.close();

console.log('\n=== CRAWL RESULTS ===');
console.log(JSON.stringify({
  totalPages: Object.keys(pageData).length,
  pages: pageData
}, null, 2));
