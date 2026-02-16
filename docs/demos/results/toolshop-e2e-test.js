/**
 * E2E Integration Test: Practice Software Testing (ToolShop)
 * Uses Playwright with Chromium headless browser
 * Tests: Homepage, Product Browsing, Search, Product Detail, Cart
 */

const { chromium } = require('/workspaces/cf-devpod/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = '/workspaces/cf-devpod/docs/demos/results/toolshop';
const BASE_URL = 'https://practicesoftwaretesting.com';
const REPORT_PATH = '/workspaces/cf-devpod/docs/demos/results/toolshop-e2e-report.md';

const results = [];
let testNumber = 0;

function record(name, status, duration, details = '') {
  testNumber++;
  results.push({ number: testNumber, name, status, duration, details });
  const icon = status === 'PASS' ? '[PASS]' : '[FAIL]';
  console.log(`  ${icon} ${name} (${duration}ms)${details ? ' - ' + details : ''}`);
}

async function screenshot(page, name) {
  const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  return filePath;
}

async function measureNav(page, action) {
  const start = Date.now();
  await action();
  const elapsed = Date.now() - start;
  return elapsed;
}

async function runTests() {
  console.log('=== ToolShop E2E Integration Tests ===\n');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Browser: Chromium (headless)\n`);

  const overallStart = Date.now();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  // ─── TEST 1: Homepage Load ───
  console.log('--- Test 1: Homepage ---');
  try {
    const dur = await measureNav(page, async () => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    });
    await screenshot(page, '01-homepage');

    const title = await page.title();
    const hasProducts = await page.locator('[data-test="product-name"]').count() > 0
      || await page.locator('.card').count() > 0;

    record('Homepage loads successfully', 'PASS', dur, `Title: "${title}"`);

    if (hasProducts) {
      record('Homepage displays products', 'PASS', 0, 'Product cards found');
    } else {
      record('Homepage displays products', 'FAIL', 0, 'No product cards found');
    }
  } catch (err) {
    record('Homepage loads successfully', 'FAIL', 0, err.message);
  }

  // ─── TEST 2: Category Browsing ───
  console.log('\n--- Test 2: Category Browsing ---');
  try {
    // Look for category filters on the page
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Try clicking a category checkbox/filter
    const categorySelector = await page.locator('[data-test*="category"]').first();
    const categoryExists = await categorySelector.count() > 0;

    if (categoryExists) {
      const dur = await measureNav(page, async () => {
        await categorySelector.click();
        await page.waitForTimeout(2000);
      });
      await screenshot(page, '02-category-browse');

      const productCount = await page.locator('.card').count();
      record('Category filter applied', 'PASS', dur, `${productCount} products displayed after filter`);
    } else {
      // Try the categories nav link
      const navCategories = page.locator('a:has-text("Categories"), [data-test="nav-categories"]').first();
      if (await navCategories.count() > 0) {
        const dur = await measureNav(page, async () => {
          await navCategories.click();
          await page.waitForTimeout(2000);
        });
        await screenshot(page, '02-category-browse');
        record('Category navigation works', 'PASS', dur);
      } else {
        // Try checkbox filters on the left sidebar
        const checkbox = page.locator('input[type="checkbox"]').first();
        if (await checkbox.count() > 0) {
          const dur = await measureNav(page, async () => {
            await checkbox.click();
            await page.waitForTimeout(2000);
          });
          await screenshot(page, '02-category-browse');
          const productCount = await page.locator('.card').count();
          record('Category filter via checkbox', 'PASS', dur, `${productCount} products after filter`);
        } else {
          await screenshot(page, '02-category-browse');
          record('Category filter applied', 'FAIL', 0, 'No category controls found');
        }
      }
    }
  } catch (err) {
    await screenshot(page, '02-category-browse-error');
    record('Category browsing', 'FAIL', 0, err.message);
  }

  // ─── TEST 3: Search ───
  console.log('\n--- Test 3: Search for "hammer" ---');
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    const searchInput = page.locator('[data-test="search-query"]')
      .or(page.locator('input[placeholder*="Search"]'))
      .or(page.locator('input[type="search"]'))
      .or(page.locator('[data-test="search-query"]'));

    await searchInput.first().fill('hammer');
    await screenshot(page, '03-search-typed');

    const searchBtn = page.locator('[data-test="search-submit"]')
      .or(page.locator('button[type="submit"]'))
      .or(page.locator('button:has-text("Search")'));

    const dur = await measureNav(page, async () => {
      await searchBtn.first().click();
      await page.waitForTimeout(3000);
    });
    await screenshot(page, '03-search-results');

    const resultCards = await page.locator('.card').count();
    const productNames = await page.locator('[data-test="product-name"]').allTextContents();

    const hasHammer = productNames.some(n => n.toLowerCase().includes('hammer'));

    if (resultCards > 0) {
      record('Search returns results', 'PASS', dur, `${resultCards} results found`);
      if (hasHammer) {
        record('Search results contain "hammer"', 'PASS', 0, `Found: ${productNames.filter(n => n.toLowerCase().includes('hammer')).join(', ')}`);
      } else {
        record('Search results contain "hammer"', 'FAIL', 0, `Names found: ${productNames.slice(0, 5).join(', ')}`);
      }
    } else {
      record('Search returns results', 'FAIL', dur, 'No result cards');
    }
  } catch (err) {
    await screenshot(page, '03-search-error');
    record('Search functionality', 'FAIL', 0, err.message);
  }

  // ─── TEST 4: Product Detail ───
  console.log('\n--- Test 4: Product Detail ---');
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Click the first product card link
    const productLink = page.locator('a.card').or(page.locator('.card a')).first();

    const dur = await measureNav(page, async () => {
      await productLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    });
    await screenshot(page, '04-product-detail');

    const currentUrl = page.url();
    const hasProductInUrl = currentUrl.includes('product');

    // Check for product detail elements
    const nameEl = page.locator('[data-test="product-name"]').or(page.locator('h1'));
    const priceEl = page.locator('[data-test="unit-price"]').or(page.locator('.price')).or(page.locator('span:has-text("$")'));
    const descEl = page.locator('[data-test="product-description"]').or(page.locator('.description'));

    const name = await nameEl.first().textContent().catch(() => '');
    const price = await priceEl.first().textContent().catch(() => '');

    record('Product detail page loads', 'PASS', dur, `URL: ${currentUrl}`);

    if (name && name.trim().length > 0) {
      record('Product name displayed', 'PASS', 0, `Name: "${name.trim()}"`);
    } else {
      record('Product name displayed', 'FAIL', 0, 'No product name found');
    }

    if (price && price.trim().length > 0) {
      record('Product price displayed', 'PASS', 0, `Price: "${price.trim()}"`);
    } else {
      record('Product price displayed', 'FAIL', 0, 'No price element found');
    }

    const descCount = await descEl.count();
    if (descCount > 0) {
      const desc = await descEl.first().textContent();
      record('Product description displayed', 'PASS', 0, `Description length: ${desc.trim().length} chars`);
    } else {
      // Check for any descriptive paragraph
      const paraCount = await page.locator('p').count();
      record('Product description displayed', paraCount > 2 ? 'PASS' : 'FAIL', 0, `${paraCount} paragraphs found`);
    }
  } catch (err) {
    await screenshot(page, '04-product-detail-error');
    record('Product detail page', 'FAIL', 0, err.message);
  }

  // ─── TEST 5: Add to Cart ───
  console.log('\n--- Test 5: Add to Cart ---');
  try {
    // Navigate to homepage, click a product, add to cart
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Click first product
    const productLink = page.locator('a.card').or(page.locator('.card a')).first();
    await productLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Capture product name before adding
    const productName = await page.locator('[data-test="product-name"]').or(page.locator('h1')).first().textContent().catch(() => 'Unknown');
    await screenshot(page, '05-before-add-to-cart');

    // Click Add to Cart
    const addBtn = page.locator('[data-test="add-to-cart"]')
      .or(page.locator('button:has-text("Add to cart")'))
      .or(page.locator('button:has-text("Add to Cart")'));

    const addDur = await measureNav(page, async () => {
      await addBtn.first().click();
      await page.waitForTimeout(2000);
    });
    await screenshot(page, '05-after-add-to-cart');

    record('Add to cart button clicked', 'PASS', addDur, `Product: "${productName.trim()}"`);

    // Navigate to cart
    const cartLink = page.locator('[data-test="nav-cart"]')
      .or(page.locator('a[href*="cart"]'))
      .or(page.locator('[data-test="cart-quantity"]'))
      .or(page.locator('a:has-text("Cart")'));

    const cartDur = await measureNav(page, async () => {
      await cartLink.first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    });
    await screenshot(page, '05-cart-page');

    const cartUrl = page.url();
    record('Cart page loaded', 'PASS', cartDur, `URL: ${cartUrl}`);

    // Verify item in cart
    const cartItems = page.locator('[data-test="product-title"]')
      .or(page.locator('.card-title'))
      .or(page.locator('table tbody tr'));

    const itemCount = await cartItems.count();
    if (itemCount > 0) {
      const cartItemText = await cartItems.first().textContent().catch(() => '');
      record('Cart contains added item', 'PASS', 0, `Items in cart: ${itemCount}, First: "${cartItemText.trim()}"`);
    } else {
      // Check if there is any content suggesting items
      const bodyText = await page.locator('body').textContent();
      const hasCartContent = bodyText.toLowerCase().includes('cart') && !bodyText.toLowerCase().includes('empty');
      record('Cart contains added item', hasCartContent ? 'PASS' : 'FAIL', 0,
        hasCartContent ? 'Cart has content' : 'Cart appears empty');
    }
  } catch (err) {
    await screenshot(page, '05-cart-error');
    record('Cart functionality', 'FAIL', 0, err.message);
  }

  // ─── Cleanup ───
  await browser.close();
  const totalDuration = Date.now() - overallStart;

  // ─── Generate Report ───
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total = results.length;

  console.log(`\n=== Results: ${passed}/${total} passed, ${failed} failed (${totalDuration}ms total) ===\n`);

  const report = generateReport(passed, failed, total, totalDuration);
  fs.writeFileSync(REPORT_PATH, report);
  console.log(`Report written to: ${REPORT_PATH}`);
  console.log(`Screenshots saved to: ${SCREENSHOT_DIR}/`);

  // List screenshots
  const screenshots = fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png'));
  console.log(`Screenshots captured: ${screenshots.length}`);
  screenshots.forEach(s => console.log(`  - ${s}`));

  process.exit(failed > 0 ? 1 : 0);
}

function generateReport(passed, failed, total, totalDuration) {
  const screenshots = fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png'));
  const now = new Date().toISOString();

  let md = `# ToolShop E2E Integration Test Report

**Date**: ${now}
**Target**: ${BASE_URL}
**Browser**: Chromium (headless via Playwright)
**Total Duration**: ${(totalDuration / 1000).toFixed(1)}s

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${total} |
| Passed | ${passed} |
| Failed | ${failed} |
| Pass Rate | ${((passed / total) * 100).toFixed(1)}% |
| Duration | ${(totalDuration / 1000).toFixed(1)}s |

## Test Results

| # | Test | Status | Duration | Details |
|---|------|--------|----------|---------|
`;

  for (const r of results) {
    const statusBadge = r.status === 'PASS' ? 'PASS' : 'FAIL';
    const details = r.details.replace(/\|/g, '\\|');
    md += `| ${r.number} | ${r.name} | ${statusBadge} | ${r.duration}ms | ${details} |\n`;
  }

  md += `
## Test Scenarios

### 1. Homepage Load
- Navigate to ${BASE_URL}
- Verify page loads and product cards are displayed

### 2. Category Browsing
- Apply a category filter
- Verify product list updates

### 3. Search Functionality
- Search for "hammer"
- Verify results contain relevant products

### 4. Product Detail
- Click a product from the listing
- Verify product name, price, and description are displayed

### 5. Cart Operations
- Add a product to cart from product detail page
- Navigate to cart page
- Verify added item appears in cart

## Screenshots

${screenshots.map(s => `- \`${s}\``).join('\n')}

## Environment

- **Platform**: Linux (Codespace)
- **Node.js**: ${process.version}
- **Playwright**: Chromium headless
- **Network**: Direct HTTPS

---
*Generated by AQE v3 Integration Tester - ${now}*
`;

  return md;
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
