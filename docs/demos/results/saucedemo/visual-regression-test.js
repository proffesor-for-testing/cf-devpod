/**
 * Visual Regression Test Script for SauceDemo
 * AQE v3 Visual Tester - Playwright + Chromium
 *
 * Captures screenshots for standard_user and visual_user,
 * then performs pixel-level comparison to detect visual regressions.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const OUTPUT_DIR = '/workspaces/cf-devpod/docs/demos/results/saucedemo';
const VIEWPORTS = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
];

// We'll use desktop as the primary viewport for both users,
// and also capture multi-viewport for standard_user
const USERS = [
  { username: 'standard_user', password: 'secret_sauce', label: 'standard' },
  { username: 'visual_user', password: 'secret_sauce', label: 'visual' },
];

const PAGES = ['login', 'inventory', 'product-detail', 'cart'];

async function captureScreenshotsForUser(browser, user, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const prefix = `${user.label}_${viewport.name}`;
  const results = {};

  try {
    // 1. Login page
    console.log(`  [${prefix}] Navigating to login page...`);
    await page.goto('https://www.saucedemo.com/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('#login-button', { timeout: 10000 });
    const loginPath = path.join(OUTPUT_DIR, `${prefix}_login.png`);
    await page.screenshot({ path: loginPath, fullPage: true });
    results.login = { path: loginPath, timestamp: new Date().toISOString() };
    console.log(`  [${prefix}] Login screenshot saved.`);

    // 2. Perform login
    console.log(`  [${prefix}] Logging in as ${user.username}...`);
    await page.fill('#user-name', user.username);
    await page.fill('#password', user.password);
    await page.click('#login-button');
    await page.waitForSelector('.inventory_list', { timeout: 10000 });

    // 3. Inventory page
    const inventoryPath = path.join(OUTPUT_DIR, `${prefix}_inventory.png`);
    await page.screenshot({ path: inventoryPath, fullPage: true });
    results.inventory = { path: inventoryPath, timestamp: new Date().toISOString() };
    console.log(`  [${prefix}] Inventory screenshot saved.`);

    // 4. Product detail page - click first product
    console.log(`  [${prefix}] Clicking on first product...`);
    await page.click('.inventory_item_name');
    await page.waitForSelector('.inventory_details', { timeout: 10000 });
    const productPath = path.join(OUTPUT_DIR, `${prefix}_product-detail.png`);
    await page.screenshot({ path: productPath, fullPage: true });
    results['product-detail'] = { path: productPath, timestamp: new Date().toISOString() };
    console.log(`  [${prefix}] Product detail screenshot saved.`);

    // 5. Add to cart and go to cart
    console.log(`  [${prefix}] Adding item to cart...`);
    await page.click('button[data-test^="add-to-cart"]');
    await page.click('.shopping_cart_link');
    await page.waitForSelector('.cart_list', { timeout: 10000 });
    const cartPath = path.join(OUTPUT_DIR, `${prefix}_cart.png`);
    await page.screenshot({ path: cartPath, fullPage: true });
    results.cart = { path: cartPath, timestamp: new Date().toISOString() };
    console.log(`  [${prefix}] Cart screenshot saved.`);

  } catch (err) {
    console.error(`  [${prefix}] Error: ${err.message}`);
    results.error = err.message;
  } finally {
    await context.close();
  }

  return results;
}

/**
 * Simple pixel-diff comparison between two PNG files.
 * Returns { totalPixels, diffPixels, diffPercentage, diffRegions }
 */
function compareScreenshots(pathA, pathB) {
  const bufA = fs.readFileSync(pathA);
  const bufB = fs.readFileSync(pathB);
  const imgA = PNG.sync.read(bufA);
  const imgB = PNG.sync.read(bufB);

  // Handle different sizes
  const width = Math.max(imgA.width, imgB.width);
  const height = Math.max(imgA.height, imgB.height);
  const totalPixels = width * height;
  let diffPixels = 0;

  // Create diff image
  const diff = new PNG({ width, height });

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idxDiff = (y * width + x) * 4;

      // Get pixel from A (or transparent if out of bounds)
      let rA = 0, gA = 0, bA = 0, aA = 0;
      if (x < imgA.width && y < imgA.height) {
        const idxA = (y * imgA.width + x) * 4;
        rA = imgA.data[idxA]; gA = imgA.data[idxA + 1];
        bA = imgA.data[idxA + 2]; aA = imgA.data[idxA + 3];
      }

      // Get pixel from B (or transparent if out of bounds)
      let rB = 0, gB = 0, bB = 0, aB = 0;
      if (x < imgB.width && y < imgB.height) {
        const idxB = (y * imgB.width + x) * 4;
        rB = imgB.data[idxB]; gB = imgB.data[idxB + 1];
        bB = imgB.data[idxB + 2]; aB = imgB.data[idxB + 3];
      }

      const colorDiff = Math.abs(rA - rB) + Math.abs(gA - gB) + Math.abs(bA - bB) + Math.abs(aA - aB);

      if (colorDiff > 30) { // threshold: ~3% per channel
        diffPixels++;
        // Highlight diff in red
        diff.data[idxDiff] = 255;
        diff.data[idxDiff + 1] = 0;
        diff.data[idxDiff + 2] = 0;
        diff.data[idxDiff + 3] = 200;
      } else {
        // Dim the original
        diff.data[idxDiff] = Math.round((rA + rB) / 2 * 0.3);
        diff.data[idxDiff + 1] = Math.round((gA + gB) / 2 * 0.3);
        diff.data[idxDiff + 2] = Math.round((bA + bB) / 2 * 0.3);
        diff.data[idxDiff + 3] = 255;
      }
    }
  }

  const diffPercentage = ((diffPixels / totalPixels) * 100).toFixed(2);

  // Save diff image
  const diffPath = pathA.replace('standard_', 'diff_');
  fs.writeFileSync(diffPath, PNG.sync.write(diff));

  return {
    totalPixels,
    diffPixels,
    diffPercentage: parseFloat(diffPercentage),
    diffImagePath: diffPath,
    sizeA: `${imgA.width}x${imgA.height}`,
    sizeB: `${imgB.width}x${imgB.height}`,
  };
}

async function main() {
  console.log('=== AQE v3 Visual Regression Test - SauceDemo ===');
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const allResults = {};

  // Capture for each user across viewports
  for (const user of USERS) {
    console.log(`\n--- Capturing screenshots for ${user.label} user ---`);
    allResults[user.label] = {};
    for (const viewport of VIEWPORTS) {
      console.log(`\n  Viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);
      allResults[user.label][viewport.name] = await captureScreenshotsForUser(browser, user, viewport);
    }
  }

  await browser.close();

  // Perform comparisons (standard vs visual, desktop viewport)
  console.log('\n\n=== Visual Comparison: standard_user vs visual_user ===\n');
  const comparisons = {};

  for (const pageName of PAGES) {
    for (const viewport of VIEWPORTS) {
      const standardResult = allResults.standard[viewport.name][pageName];
      const visualResult = allResults.visual[viewport.name][pageName];

      if (standardResult && visualResult && !standardResult.error && !visualResult.error) {
        const key = `${viewport.name}_${pageName}`;
        console.log(`Comparing ${key}...`);
        try {
          comparisons[key] = compareScreenshots(standardResult.path, visualResult.path);
          const status = comparisons[key].diffPercentage > 1.0 ? 'FAILED' : 'PASSED';
          console.log(`  ${status}: ${comparisons[key].diffPercentage}% difference (${comparisons[key].diffPixels} pixels)`);
        } catch (err) {
          console.error(`  Error comparing ${key}: ${err.message}`);
          comparisons[key] = { error: err.message };
        }
      }
    }
  }

  // Write JSON results
  const report = {
    timestamp: new Date().toISOString(),
    tool: 'AQE v3 Visual Tester',
    browser: 'Chromium (Playwright 1.58.2)',
    viewports: VIEWPORTS,
    users: USERS.map(u => u.label),
    pages: PAGES,
    screenshots: allResults,
    comparisons,
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'visual-results.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('\n=== Results saved to visual-results.json ===');
  return report;
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
