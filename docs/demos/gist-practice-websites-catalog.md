# 103 Practice Websites for QA/QE Testing

> A curated catalog of free websites for practicing software testing -- UI automation, API testing, security, accessibility, performance, and exploratory bug hunting. Compiled Feb 2026.

## Why This List?

We needed real targets to test our AI-powered QE fleet (Agentic QE v3). We researched every practice site we could find, tested 10 of them live, and organized them by what they're actually useful for. This isn't just a link dump -- we've validated these sites and noted what works best for what.

---

## Quick Picks: Start Here

If you're short on time, these 6 sites cover the most ground:

| Site | URL | Best For |
|------|-----|----------|
| **Practice Software Testing (Toolshop)** | https://practicesoftwaretesting.com | E2E flows + API (Swagger docs included) |
| **Restful Booker** | https://restful-booker.herokuapp.com | API testing with real bugs to find |
| **Sauce Demo** | https://www.saucedemo.com | Visual regression (multiple user personas) |
| **The Internet** | https://the-internet.herokuapp.com | UI automation fundamentals |
| **API Challenges** | https://apichallenges.eviltester.com | Session-based API challenges (59 total) |
| **OWASP Juice Shop** | https://owasp.org/www-project-juice-shop/ | Security testing (Docker) |

---

## UI Automation Practice (22 sites)

### Beginner-Friendly
| Site | URL | What You'll Practice |
|------|-----|---------------------|
| The Internet | https://the-internet.herokuapp.com/ | Checkboxes, dropdowns, file upload, frames, hovers, dynamic loading |
| DemoQA | https://demoqa.com/ | Forms, widgets, alerts, bookstore API |
| Sauce Demo | https://www.saucedemo.com/ | Login, inventory, cart (try `problem_user` for bugs) |
| Expand Testing | https://practice.expandtesting.com/ | 50+ pages: Shadow DOM, iframes, drag-drop, plus REST APIs |

### Automation Playgrounds
| Site | URL | What You'll Practice |
|------|-----|---------------------|
| UI Testing Playground | http://uitestingplayground.com/ | Dynamic IDs, AJAX waits, click interception, overlapped elements |
| QA Playground | https://qaplayground.dev/ | Focused challenges for specific UI patterns |
| Tricentis Obstacle Course | https://obstaclecourse.tricentis.com/Obstacles | Progressive difficulty automation challenges |
| LambdaTest Selenium Playground | https://www.lambdatest.com/selenium-playground/ | Input forms, tables, JS alerts |
| Locator Game | https://testsmith-io.github.io/locator-game/ | Locator identification practice |
| Automation Camp | https://play2.automationcamp.ir/ | Intermediate-advanced automation |
| LetCode.in | https://letcode.in/test | Element interaction practice |
| Commit Quality | https://commitquality.com/ | Playwright resources with YouTube tutorials |

### Real-World App Clones
| Site | URL | Credentials/Notes |
|------|-----|-------------------|
| OrangeHRM | https://opensource-demo.orangehrmlive.com/ | Admin / admin123 -- full HR system |
| Sunny Meadows B&B | https://automationintesting.online/ | React + API backend, booking system |
| BookCart | https://bookcart.azurewebsites.net/ | Bookstore with Swagger API docs |
| Online Boutique | https://cymbal-shops.retail.cymbal.dev/ | Google Cloud microservices demo |
| SAP UI5 Demo Apps | https://ui5.sap.com/#/demoapps | Enterprise UI5 framework demos |

### More UI Practice
| Site | URL |
|------|-----|
| SelectorHub XPath Practice | https://selectorshub.com/xpath-practice-page/ |
| Applitools Demo | https://demo.applitools.com/ |
| Hands-On Selenium WebDriver | https://bonigarcia.dev/selenium-webdriver-java/ |
| Automate Now Sandbox | https://automatenow.io/sandbox-automation-testing-practice-website/ |
| NearForm Testing Playground | https://nearform.github.io/testing-playground/ |

---

## API Testing (32 sites)

### Full CRUD APIs (Best for Real Testing)
| Site | URL | Auth | Notes |
|------|-----|------|-------|
| **API Challenges** | https://apichallenges.eviltester.com/ | Session token | 59 challenges, JSON+XML, most realistic |
| **Restful Booker** | https://restful-booker.herokuapp.com/ | Token (POST /auth) | Has deliberate bugs -- great for defect detection |
| **Toolshop API** | https://api.practicesoftwaretesting.com/api/documentation | None for reads | Swagger docs, matches the UI |
| Expand Testing Notes | https://practice.expandtesting.com/notes/api/api-docs/ | Bearer token | Registration + auth required |
| GO Rest | https://gorest.co.in/ | OAuth2 | REST + GraphQL, data persists |
| ServeRest | https://serverest.dev/ | JWT | Virtual store: users, products, carts |

### Simulators (Quick Framework Validation)
| Site | URL | Notes |
|------|-----|-------|
| JSONPlaceholder | https://jsonplaceholder.typicode.com/ | 6 resource types, POST/PUT simulated not persisted |
| ReqRes | https://reqres.in/ | Delayed responses, pagination |
| HTTPBin | https://httpbin.org/ | Echo service for HTTP protocol testing |
| DummyJSON | https://dummyjson.com/ | Products, carts, users, search/filter |
| FakeRestAPI | https://fakerestapi.azurewebsites.net/ | Swagger-enabled |

### GraphQL APIs
| Site | URL | Notes |
|------|-----|-------|
| GO Rest GraphQL | https://gorest.co.in/graphql | Full mutations |
| Rick and Morty | https://rickandmortyapi.com/graphql | Read-only, nested data |
| Countries | https://countries.trevorblades.com/ | Filters, introspection enabled |
| DVGA | https://github.com/dolevf/Damn-Vulnerable-GraphQL-Application | Security testing (local) |

### Fun APIs (GET-focused)
| API | URL |
|-----|-----|
| Star Wars (SWAPI) | https://swapi.dev/ |
| Pokemon | https://pokeapi.co/ |
| Random User | https://randomuser.me/ |
| The Cat API | https://thecatapi.com/ |
| Chuck Norris | https://api.chucknorris.io/ |
| SpaceTraders | https://spacetraders.io/ |
| Swagger Petstore | https://petstore.swagger.io/ |

### SOAP/Legacy
| Site | URL | Notes |
|------|-----|-------|
| Parabank | https://parabank.parasoft.com/parabank/admin.htm | SOAP, WSDL, WADL |

---

## Deliberately Buggy Sites (11 sites)

These sites have bugs planted on purpose -- perfect for exploratory testing and defect detection training.

| Site | URL | Bugs | Best For |
|------|-----|------|----------|
| **AcademyBugs** | https://academybugs.com/find-bugs/ | 25 planted bugs | Bug hunting competition |
| **Basic Calculator** | https://testsheepnz.github.io/BasicCalculator.html | 9 builds with different bugs | Regression comparison |
| **Parking Calculator** | https://www.shino.de/parkcalc/ | Many calculation bugs | Boundary value analysis |
| QA Practice | https://qa-practice.netlify.app/ | Buggy forms + API + GraphQL | Multi-channel defect detection |
| Sweet Shop | https://sweetshop.netlify.app/ | Broken e-commerce | Purchase flow testing |
| Todo List | http://todolist.james.am/#/ | State management bugs | Simple functional testing |
| Black Box Puzzles | http://blackboxpuzzles.workroomprds.com/ | Puzzle-based | Exploratory technique practice |
| QA Training Simulator | https://bugeater.web.app/ | Challenge list | Beginner manual testing |
| Evil Tester Apps | https://testpages.eviltester.com/styled/index.html | Per-page challenges | Diverse technique practice |
| CandyMapper | https://www.candymapper.net/ | UI defects | Visual defect identification |
| Travel Agileway | http://travel.agileway.net/login | Business flow bugs | Session-based testing |

---

## Security Testing (12 sites)

> Only test against systems you have permission to test.

| Site | URL | Setup | Vulnerabilities |
|------|-----|-------|-----------------|
| **OWASP Juice Shop** | https://owasp.org/www-project-juice-shop/ | Docker | OWASP Top 10+, gamified |
| **Gin & Juice Shop** | https://ginandjuice.shop/ | Hosted | PortSwigger, realistic |
| bWAPP | http://www.itsecgames.com/ | VM/Docker | 100+ vulnerabilities |
| Google Gruyere | https://google-gruyere.appspot.com/ | Hosted | XSS, CSRF, path traversal |
| Hack Yourself First | https://hack-yourself-first.com/ | Hosted | Troy Hunt's practice site |
| Firing Range | https://public-firing-range.appspot.com/ | Hosted | Google's security test cases |
| Zero Bank | http://zero.webappsecurity.com/ | Hosted | Banking security flaws |
| VAmPI | https://github.com/erev0s/VAmPI | Local | OWASP API Top 10 |
| DVGA | https://github.com/dolevf/Damn-Vulnerable-GraphQL-Application | Local | GraphQL injection, DoS |
| TryHackMe | https://tryhackme.com/ | Platform | Guided labs (free tier) |

---

## E-Commerce for E2E Testing (15 sites)

| Site | URL | Key Feature |
|------|-----|-------------|
| **Toolshop** | https://practicesoftwaretesting.com/ | Full API + UI, Swagger docs |
| **Sauce Demo** | https://www.saucedemo.com/ | Multiple user personas with different bugs |
| DemoBlaze | https://demoblaze.com/ | Electronics store, modal checkout |
| Automation Test Store | https://automationteststore.com/ | Full accounts, search, checkout |
| LambdaTest E-Commerce | https://ecommerce-playground.lambdatest.io/ | Feature-rich |
| BookCart | https://bookcart.azurewebsites.net/ | Books + Swagger API |
| React Shopping Cart | https://react-shopping-cart-67954.firebaseapp.com/ | Modern SPA |
| Online Boutique | https://cymbal-shops.retail.cymbal.dev/ | 11 microservices |
| PrestaShop | https://demo.prestashop.com/ | Full open-source platform |
| Weather Shopper | https://weathershopper.pythonanywhere.com/ | Dynamic recommendations |
| Automation Bookstore | https://automationbookstore.dev/ | Search + responsive |
| GreenKart | https://rahulshettyacademy.com/seleniumPractise/#/ | Grocery store |

---

## Performance Testing
| Site | URL | Notes |
|------|-----|-------|
| BlazeDemo | https://blazedemo.com/ | BlazeMeter's travel agency demo |
| Pet Store (OctoPerf) | https://petstore.octoperf.com/actions/Catalog.action | Performance testing target |
| QuickPizza (k6) | https://github.com/grafana/quickpizza | k6 performance test examples |
| k6 Test API | https://test-api.k6.io/ | HTTP + WebSocket + JWT auth |

## Accessibility
| Site | URL |
|------|-----|
| Gov.UK Accessibility Tool Audit | https://alphagov.github.io/accessibility-tool-audit/test-cases.html |

## Mobile
| Site | URL |
|------|-----|
| DVIA (iOS) | http://damnvulnerableiosapp.com/ |
| SauceLabs Sample Apps | https://github.com/saucelabs/sample-app-mobile |

---

## Mega Lists (For More)

| Resource | URL |
|----------|-----|
| Ministry of Testing (75+ sites) | https://www.ministryoftesting.com/articles/75-testing-practice-websites-to-master-software-qa-in-2024 |
| awesome-sites-to-test-on (GitHub) | https://github.com/BMayhew/awesome-sites-to-test-on |
| Public APIs (GitHub) | https://github.com/public-apis/public-apis |
| Free Public APIs | https://www.freepublicapis.com/ |

---

## How We Compiled This

We researched Ministry of Testing, GitHub curated lists, BugBug, Evil Tester, and community recommendations, then validated sites by actually testing them with our QE fleet. Sites that were down, paywalled, or broken beyond usefulness were excluded.

*Compiled 2026-02-16. PRs welcome if you find new practice sites.*
