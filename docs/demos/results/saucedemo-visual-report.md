# Visual Regression Test Report: SauceDemo

**Tool**: AQE v3 Visual Tester
**Date**: 2026-02-16
**Browser**: Chromium (Playwright 1.58.2), Headless
**Target**: https://www.saucedemo.com/
**Method**: Pixel-diff comparison between `standard_user` (baseline) and `visual_user` (test subject)

---

## Executive Summary

**5 of 12 comparisons FAILED** visual regression checks (threshold: 1.0% pixel diff).

The `visual_user` account on SauceDemo is intentionally designed to expose visual bugs. This test successfully detected all injected visual regressions. The most severe differences appear on the **inventory page** across all viewports (up to 40.52% diff on mobile) and the **cart page** on tablet and mobile viewports.

| Status | Count |
|--------|-------|
| PASSED | 7 |
| FAILED | 5 |
| Total Comparisons | 12 |
| Total Screenshots | 36 (24 user screenshots + 12 diff images) |

---

## Comparison Results by Page

### Login Page

| Viewport | Diff % | Diff Pixels | Status |
|----------|--------|-------------|--------|
| Desktop (1920x1080) | 0.00% | 0 | PASSED |
| Tablet (768x1024) | 0.00% | 0 | PASSED |
| Mobile (375x812) | 0.00% | 0 | PASSED |

**Analysis**: The login page renders identically for both users. This is expected since visual bugs are only injected post-login.

---

### Inventory Page

| Viewport | Diff % | Diff Pixels | Status |
|----------|--------|-------------|--------|
| Desktop (1920x1080) | 2.01% | 42,849 | **FAILED** |
| Tablet (768x1024) | 4.33% | 62,415 | **FAILED** |
| Mobile (375x812) | 40.52% | 798,302 | **FAILED** |

**Analysis -- CRITICAL REGRESSIONS DETECTED**:

The inventory page shows significant visual differences between `standard_user` and `visual_user`:

1. **Product images altered**: The Sauce Labs Backpack product image is replaced with a completely different image (a dog photo instead of the backpack). This is a major visual bug affecting the primary product listing.

2. **Price values changed**: All product prices are different for `visual_user`. For example:
   - Sauce Labs Backpack: $29.99 (standard) vs $61.23 (visual)
   - Sauce Labs Bike Light: $9.99 (standard) vs $69.97 (visual)
   - Sauce Labs Bolt T-Shirt: $15.99 (standard) vs $69.62 (visual)
   - Sauce Labs Fleece Jacket: $49.99 (standard) vs $85.92 (visual)
   - Sauce Labs Onesie: $7.99 (standard) vs $4.32 (visual)
   - Test.allTheThings() T-Shirt: $15.99 (standard) vs $28.83 (visual)

3. **Mobile viewport most affected**: At 375px, the single-column layout causes product images and price changes to occupy a proportionally larger area of the screen, amplifying the diff percentage to 40.52%.

**Severity**: HIGH -- Product images and pricing are core e-commerce elements. These regressions would directly impact purchasing decisions.

---

### Product Detail Page

| Viewport | Diff % | Diff Pixels | Status |
|----------|--------|-------------|--------|
| Desktop (1920x1080) | 0.03% | 657 | PASSED |
| Tablet (768x1024) | 0.08% | 657 | PASSED |
| Mobile (375x812) | 0.15% | 657 | PASSED |

**Analysis**: The product detail page shows only 657 differing pixels across all viewports. This is a very minor difference likely caused by subtle text rendering or price value differences at a small scale. Below the 1% threshold.

---

### Cart Page

| Viewport | Diff % | Diff Pixels | Status |
|----------|--------|-------------|--------|
| Desktop (1920x1080) | 0.74% | 15,252 | PASSED |
| Tablet (768x1024) | 6.21% | 48,816 | **FAILED** |
| Mobile (375x812) | 18.89% | 60,226 | **FAILED** |

**Analysis -- REGRESSIONS DETECTED**:

1. **Header/navigation area changes**: The cart page diff images show changes concentrated in the header bar and the checkout button area. The cart icon rendering differs between users.

2. **Responsive layout shift**: At tablet and mobile viewports, the visual changes become proportionally larger, pushing the diff well above the 1% threshold. The checkout button area shows a significant color/positioning change.

3. **Desktop narrowly passes**: At 0.74%, the desktop viewport just barely passes the 1% threshold, indicating changes are present but occupy less relative area on the larger screen.

**Severity**: MEDIUM -- Navigation and checkout button changes could confuse users and disrupt the purchase flow.

---

## Viewport Coverage Analysis

| Viewport | Pages Tested | Passed | Failed | Failure Rate |
|----------|-------------|--------|--------|-------------|
| Desktop (1920x1080) | 4 | 3 | 1 | 25% |
| Tablet (768x1024) | 4 | 2 | 2 | 50% |
| Mobile (375x812) | 4 | 2 | 2 | 50% |

**Key Finding**: Smaller viewports amplify visual regressions. The same underlying bugs produce higher diff percentages on mobile because changed elements occupy a larger proportion of the viewport. Mobile testing is essential for catching regressions that might appear marginal on desktop.

---

## AI Semantic Analysis Summary

| Regression Type | Pages Affected | Severity |
|----------------|----------------|----------|
| Image replacement | Inventory | HIGH |
| Price text changes | Inventory, Cart | HIGH |
| Layout/positioning shifts | Cart (tablet/mobile) | MEDIUM |
| Color changes in UI elements | Cart header/buttons | MEDIUM |

---

## Files Generated

### Screenshots (Baseline -- standard_user)
- `saucedemo/standard_desktop_login.png`
- `saucedemo/standard_desktop_inventory.png`
- `saucedemo/standard_desktop_product-detail.png`
- `saucedemo/standard_desktop_cart.png`
- `saucedemo/standard_tablet_login.png`
- `saucedemo/standard_tablet_inventory.png`
- `saucedemo/standard_tablet_product-detail.png`
- `saucedemo/standard_tablet_cart.png`
- `saucedemo/standard_mobile_login.png`
- `saucedemo/standard_mobile_inventory.png`
- `saucedemo/standard_mobile_product-detail.png`
- `saucedemo/standard_mobile_cart.png`

### Screenshots (Test Subject -- visual_user)
- `saucedemo/visual_desktop_login.png`
- `saucedemo/visual_desktop_inventory.png`
- `saucedemo/visual_desktop_product-detail.png`
- `saucedemo/visual_desktop_cart.png`
- `saucedemo/visual_tablet_login.png`
- `saucedemo/visual_tablet_inventory.png`
- `saucedemo/visual_tablet_product-detail.png`
- `saucedemo/visual_tablet_cart.png`
- `saucedemo/visual_mobile_login.png`
- `saucedemo/visual_mobile_inventory.png`
- `saucedemo/visual_mobile_product-detail.png`
- `saucedemo/visual_mobile_cart.png`

### Diff Images (Red = Changed Pixels)
- `saucedemo/diff_desktop_login.png`
- `saucedemo/diff_desktop_inventory.png`
- `saucedemo/diff_desktop_product-detail.png`
- `saucedemo/diff_desktop_cart.png`
- `saucedemo/diff_tablet_login.png`
- `saucedemo/diff_tablet_inventory.png`
- `saucedemo/diff_tablet_product-detail.png`
- `saucedemo/diff_tablet_cart.png`
- `saucedemo/diff_mobile_login.png`
- `saucedemo/diff_mobile_inventory.png`
- `saucedemo/diff_mobile_product-detail.png`
- `saucedemo/diff_mobile_cart.png`

### Data
- `saucedemo/visual-results.json` -- Full structured results
- `saucedemo/visual-regression-test.js` -- Test script

---

## Recommendations

1. **Investigate inventory page image pipeline**: The product image replacement (backpack to dog photo) suggests a broken image URL or asset serving issue for `visual_user`.

2. **Audit price data source**: All prices differ between users, indicating either a pricing service bug or a data integrity issue in the user-specific product catalog.

3. **Test responsive layouts with real device viewports**: Mobile (375px) showed a 40.52% diff compared to 2.01% on desktop for the same page. Responsive testing should be mandatory in CI/CD.

4. **Lower cart page threshold**: The desktop cart page passed at 0.74% but contains real visual changes. Consider a 0.5% threshold for checkout-critical pages.

---

*Report generated by AQE v3 Visual Tester | Chromium headless via Playwright 1.58.2*
