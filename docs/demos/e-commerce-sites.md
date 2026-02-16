# E-Commerce Demo Sites for End-to-End Testing

Demo storefronts and shopping apps ideal for testing purchase flows, cart management, checkout, and full E2E scenarios.

---

## Top Picks for QE Fleet

### Practice Software Testing (Toolshop)
- **URL**: https://practicesoftwaretesting.com/
- **API Docs**: https://api.practicesoftwaretesting.com/api/documentation
- **Author**: Roy De Kleijn
- **What**: Modern e-commerce with product browsing, filtering, cart, checkout. Full API with Swagger docs
- **QE Use**: E2E flow testing, API + UI alignment, contract testing

### Sauce Demo (Swag Labs)
- **URL**: https://www.saucedemo.com/
- **Credentials**: standard_user / secret_sauce (plus problem_user, performance_glitch_user, etc.)
- **What**: Shopping app with multiple user personas exhibiting different behaviors
- **QE Use**: Persona-based testing, visual regression, performance testing

### DemoBlaze
- **URL**: https://demoblaze.com/
- **What**: Electronics store - product categories, cart, purchase with modal form
- **QE Use**: Category navigation, modal interactions, purchase flow validation

### Automation Test Store
- **URL**: https://automationteststore.com/
- **What**: Full-featured e-commerce with user accounts, product search, cart, checkout
- **QE Use**: User registration flows, search testing, complete purchase lifecycle

### LambdaTest E-Commerce Playground
- **URL**: https://ecommerce-playground.lambdatest.io/
- **What**: Feature-rich e-commerce site for automation practice
- **QE Use**: Complex UI interactions, data-driven testing

---

## Additional E-Commerce Apps

### BookCart
- **URL**: https://bookcart.azurewebsites.net/
- **API**: Swagger docs available
- **What**: Book store with search, wishlist, cart, checkout
- **QE Use**: Search testing, API validation, purchase flows

### React Shopping Cart
- **URL**: https://react-shopping-cart-67954.firebaseapp.com/
- **What**: Modern React-based shopping cart
- **QE Use**: SPA testing, state management, responsive design

### Online Boutique (Google Cloud)
- **URL**: https://cymbal-shops.retail.cymbal.dev/
- **What**: Google's microservices demo - 11 interconnected services
- **QE Use**: Distributed e-commerce testing, microservice interaction

### PrestaShop Demo
- **URL**: https://demo.prestashop.com/#/en/front
- **What**: Full-featured open source e-commerce platform demo
- **QE Use**: Complex e-commerce workflows, admin panel testing

### Polymer Shop
- **URL**: https://shop.polymer-project.org/
- **What**: E-commerce demo using Polymer/Web Components
- **QE Use**: Web Components testing, progressive web app testing

### Sweet Shop (Buggy)
- **URL**: https://sweetshop.netlify.app/
- **What**: Intentionally broken store - great for finding defects
- **QE Use**: Defect detection in e-commerce context

### GreenKart
- **URL**: https://rahulshettyacademy.com/seleniumPractise/#/
- **What**: Grocery store app from Rahul Shetty Academy
- **QE Use**: Simple cart testing, filtering, search

### Weather Shopper
- **URL**: https://weathershopper.pythonanywhere.com/
- **What**: Shop that recommends products based on weather/temperature
- **QE Use**: Dynamic content testing, conditional logic validation

### Automation Bookstore
- **URL**: https://automationbookstore.dev/
- **What**: Responsive bookstore with search functionality
- **QE Use**: Search testing, responsive design validation

---

## Recommended QE Fleet E2E Scenarios

### Full Purchase Flow Test
```
Target: practicesoftwaretesting.com
1. Browse products with filters
2. Add items to cart
3. Register/login
4. Complete checkout
5. Validate order via API
```

### Multi-Persona Testing
```
Target: saucedemo.com
1. Test with standard_user - happy path
2. Test with problem_user - visual/functional bugs
3. Test with performance_glitch_user - slow responses
4. Test with error_user - error states
5. Test with visual_user - visual regression
```

### Cross-Site Comparison
```
Run identical E2E flows across:
- practicesoftwaretesting.com
- automationteststore.com
- demoblaze.com
Compare: reliability, performance, defect counts
```

---

## Sources
- [awesome-sites-to-test-on](https://github.com/BMayhew/awesome-sites-to-test-on)
- [BugBug - Sample Web Applications](https://bugbug.io/blog/software-testing/sample-web-application/)
- [David Mello - Best Websites for Practicing Test Automation](https://www.davidmello.com/best-websites-for-practicing-test-automation/)
