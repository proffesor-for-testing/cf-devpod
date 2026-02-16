# Accessibility Remediation Guide: Toolshop v5.0

## Quick Win: Fix aria-hidden-focus (0.25h)

### Context
The language selector dropdown button in the navbar has `aria-hidden="true"` while remaining focusable. This is an Angular/Bootstrap component conflict.

**Confidence: 0.98** - Clear context from HTML: Bootstrap dropdown toggle with Angular bindings.

### Option 1: Remove aria-hidden (Recommended)
```html
<!-- BEFORE -->
<button id="language" type="button" data-test="language-select"
        aria-hidden="true" data-bs-toggle="dropdown"
        aria-expanded="false" class="btn nav-link dropdown-toggle">

<!-- AFTER -->
<button id="language" type="button" data-test="language-select"
        aria-label="Select language"
        data-bs-toggle="dropdown"
        aria-expanded="false" class="btn nav-link dropdown-toggle">
```

**Rationale:** The button should be accessible to screen readers. Adding `aria-label="Select language"` provides a clear purpose. Removing `aria-hidden` makes it visible to assistive technology.

### Option 2: Make non-focusable (if intentionally hidden)
```html
<!-- AFTER (only if language selector should be hidden from keyboard users) -->
<button id="language" type="button" data-test="language-select"
        aria-hidden="true" tabindex="-1"
        data-bs-toggle="dropdown"
        aria-expanded="false" class="btn nav-link dropdown-toggle">
```

**Rationale:** If the language selector is intentionally hidden (duplicate of another control), adding `tabindex="-1"` prevents keyboard focus. But this also means keyboard-only users cannot change language.

## Structural Improvements (2h total)

### Add Semantic Landmarks
```html
<!-- Wrap existing Angular layout with landmarks -->
<header role="banner">
  <nav aria-label="Main navigation">
    <!-- existing navbar content -->
  </nav>
</header>

<main id="main-content" role="main">
  <!-- existing router-outlet content -->
</main>

<footer role="contentinfo">
  <!-- existing footer content -->
</footer>
```

### Add Skip Link
```html
<!-- Add as first child of <body> -->
<a href="#main-content" class="skip-link">Skip to main content</a>

<style>
.skip-link {
  position: absolute;
  top: -100%;
  left: 16px;
  background: #000;
  color: #fff;
  padding: 12px 24px;
  z-index: 10000;
  text-decoration: none;
  font-weight: bold;
  border-radius: 0 0 4px 4px;
}
.skip-link:focus {
  top: 0;
  outline: 3px solid #ffcc00;
  outline-offset: 2px;
}
</style>
```

### Add H1 Headings
```html
<!-- Homepage -->
<h1>Practice Software Testing - Toolshop</h1>

<!-- Product Listing -->
<h1>Hand Tools</h1>

<!-- Product Detail -->
<h1>{{ product.name }}</h1>

<!-- Contact -->
<h1>Contact Us</h1>
```

## Testing Checklist

- [ ] Tab through entire page - language button either accessible or skipped
- [ ] Screen reader announces language selector correctly
- [ ] All pages have h1 heading
- [ ] Landmarks navigable via screen reader rotor
- [ ] Skip link visible on focus, navigates correctly
- [ ] All form fields on contact page have labels
- [ ] Product images have descriptive alt text
