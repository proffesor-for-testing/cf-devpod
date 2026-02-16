# API Testing Practice Sites

REST, GraphQL, and WebSocket APIs for testing automation, contract validation, and API quality engineering.

---

## Full CRUD APIs (Best for QE Fleet)

### API Challenges (Evil Tester)
- **URL**: https://apichallenges.eviltester.com/
- **Docs**: https://apichallenges.eviltester.com/gui/challenges
- **What**: Fully functional TODOs management app with 50+ challenges, session-based
- **Auth**: Session-based (POST /challenger)
- **Features**: JSON + XML support, authentication, validation, filtering
- **QE Use**: Contract testing, challenge-based validation, comprehensive API testing

### Restful Booker
- **URL**: https://restful-booker.herokuapp.com/
- **Docs**: https://restful-booker.herokuapp.com/apidoc/index.html
- **What**: Hotel booking API with intentional bugs - authentication, CRUD on bookings
- **Auth**: Token-based (POST /auth)
- **Note**: Deliberately buggy - good for defect detection
- **QE Use**: API defect hunting, auth flow testing, contract validation

### Practice Software Testing (Toolshop)
- **URL**: https://api.practicesoftwaretesting.com/api/documentation
- **UI**: https://practicesoftwaretesting.com/
- **What**: Full CRUD e-commerce API with accompanying UI
- **QE Use**: API + UI contract alignment, end-to-end API flows

### Expand Testing Notes API
- **URL**: https://practice.expandtesting.com/notes/api/api-docs/
- **What**: Notes app requiring registration and token-based auth
- **Auth**: Bearer token
- **QE Use**: Authentication testing, CRUD operations, Swagger validation

### GO Rest
- **URL**: https://gorest.co.in/
- **What**: Functional API persisting data in shared session, supports GraphQL
- **Auth**: OAuth2 Bearer token
- **Features**: REST + GraphQL, pagination, nested resources
- **QE Use**: GraphQL testing, OAuth flows, data persistence validation

### ServeRest
- **URL**: https://serverest.dev/
- **What**: REST API simulating a virtual store - users, products, carts, login
- **Auth**: JWT token
- **QE Use**: E-commerce API patterns, auth testing

### Simple API (Evil Tester)
- **URL**: https://apichallenges.eviltester.com/practice-modes/simpleapi
- **What**: JSON and XML support, no authentication needed
- **QE Use**: Quick API smoke testing, format negotiation

---

## Simulators (Read-Only or Mocked)

### JSONPlaceholder
- **URL**: https://jsonplaceholder.typicode.com/
- **What**: Fake online REST API - posts, comments, albums, photos, todos, users
- **Note**: POST/PUT/DELETE are simulated (not persisted)
- **QE Use**: Quick automation framework validation, response schema testing

### ReqRes
- **URL**: https://reqres.in/
- **What**: Hosted REST-API with hard-coded user data, simulated CRUD
- **Features**: Delayed responses, pagination, error simulation
- **QE Use**: Frontend integration testing, retry logic testing

### HTTPBin
- **URL**: https://httpbin.org/
- **What**: HTTP request/response testing service - inspect headers, auth, redirects, status codes
- **QE Use**: HTTP method testing, header validation, redirect handling, status code verification

### DummyJSON
- **URL**: https://dummyjson.com/
- **What**: Multiple endpoints (products, carts, users, posts, comments) with query parameters
- **QE Use**: Pagination testing, search/filter validation, data relationship testing

### Fake REST API
- **URL**: https://fakerestapi.azurewebsites.net/index.html
- **What**: Swagger-enabled simulator with JSON validation
- **QE Use**: Swagger/OpenAPI validation, schema testing

### Beeceptor Sample APIs
- **URL**: https://beeceptor.com/mock-server/explore/
- **What**: Pre-built mock servers for users, blogs, companies, e-commerce
- **Features**: CORS-enabled, realistic data
- **QE Use**: Mock-based testing, CORS validation

---

## GraphQL APIs

### GO Rest GraphQL
- **URL**: https://gorest.co.in/graphql
- **What**: Full GraphQL API with mutations
- **QE Use**: GraphQL query/mutation testing, schema introspection

### Rick and Morty API
- **URL**: https://rickandmortyapi.com/graphql
- **What**: Character, location, and episode data via GraphQL
- **QE Use**: GraphQL query testing, nested data resolution

### Countries GraphQL
- **URL**: https://countries.trevorblades.com/
- **What**: Country data via GraphQL
- **QE Use**: GraphQL query optimization, filter testing

### Damn Vulnerable GraphQL Application
- **URL**: https://github.com/dolevf/Damn-Vulnerable-GraphQL-Application
- **What**: Intentionally vulnerable GraphQL service (local install)
- **QE Use**: GraphQL security testing, injection testing

---

## Fun/Themed APIs (GET-focused)

| API | URL | Data |
|-----|-----|------|
| Star Wars (SWAPI) | https://swapi.dev/ | Characters, planets, films |
| Pokemon | https://pokeapi.co/ | Pokemon data, abilities, types |
| Random User | https://randomuser.me/ | Random user profiles |
| The Cat API | https://thecatapi.com/ | Cat images and breeds |
| Chuck Norris | https://api.chucknorris.io/ | Chuck Norris jokes |
| Open Movie DB | http://www.omdbapi.com/ | Movie data (needs free key) |
| Marvel | https://developer.marvel.com/docs | Comics and characters (signup) |
| SpaceTraders | https://spacetraders.io/ | Multiplayer space trading game |

---

## SOAP/WSDL

### Parabank
- **URL**: https://parabank.parasoft.com/parabank/admin.htm
- **What**: Banking site with SOAP, WSDL, and WADL web services
- **QE Use**: SOAP testing, WSDL validation, legacy API testing

---

## API Resource Lists

| Resource | URL |
|----------|-----|
| Public APIs (GitHub) | https://github.com/public-apis/public-apis |
| Free APIs Directory | https://free-apis.github.io |
| RapidAPI Free APIs | https://rapidapi.com/collection/list-of-free-apis |
| Postman Collections | https://www.postman.com/explore/collections |
| API List | https://apilist.fun |
| Free Public APIs | https://www.freepublicapis.com/ |
| Apipheny Free APIs | https://apipheny.io/free-api/ |
| Ultimate API Challenge | https://theultimateapichallenge.com/challenges |

---

## Sources
- [Evil Tester - API Practice Sites](https://apichallenges.eviltester.com/practice-sites)
- [awesome-sites-to-test-on](https://github.com/BMayhew/awesome-sites-to-test-on)
- [Apipheny - 90+ Free APIs](https://apipheny.io/free-api/)
- [Beeceptor Sample APIs](https://beeceptor.com/docs/sample-api-for-testing/)
- [DotMock - 12 Best Sample APIs](https://dotmock.com/blog/sample-api-to-test)
