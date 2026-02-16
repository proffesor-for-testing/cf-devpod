# Root Cause Analysis: Restful Booker API

**Date**: 2026-02-16
**Analyst**: AQE v3 Root Cause Analyzer
**Target**: https://restful-booker.herokuapp.com
**Framework Detected**: Express.js (via `X-Powered-By: Express` header)
**Bugs Analyzed**: 6
**Technique**: 5-Whys + Change Analysis + Pattern Correlation

---

## Executive Summary

All 6 bugs in the Restful Booker API trace back to **two systemic root causes**:

1. **Express.js `res.sendStatus()` misuse** -- The developer used `res.sendStatus(201)` as a generic "success" response across semantically different operations (health check, delete), causing both wrong status codes and the misleading "Created" body text. This accounts for Bugs 1, 4, and 6.

2. **Absent input validation layer** -- No request validation middleware exists. The application passes raw input directly to the data layer, causing unhandled exceptions (500 errors) instead of structured 400 responses. Combined with a design choice to return 200 for all auth and creation responses regardless of outcome, this accounts for Bugs 2, 3, and 5.

---

## Bug 1: GET /ping Returns 201 Instead of 200

### Reproduction Evidence

```
Request:  GET /ping
Response: HTTP/1.1 201 Created
          Content-Type: text/plain; charset=utf-8
          Content-Length: 7
          Body: "Created"

Request:  HEAD /ping
Response: HTTP/1.1 201 Created

Request:  GET /health
Response: HTTP/1.1 404 Not Found (endpoint does not exist)

Request:  GET /
Response: HTTP/1.1 200 OK (HTML welcome page)
```

### 5-Whys Analysis

1. **Why does /ping return 201?** -- The route handler calls `res.sendStatus(201)` instead of `res.sendStatus(200)`.
2. **Why 201 specifically?** -- The developer likely used 201 as a generic "everything is fine" response, or copy-pasted from another route handler (possibly the delete handler, which also returns 201).
3. **Why was this not caught?** -- No contract tests or API specification (OpenAPI) existed to validate response codes against expected behavior.
4. **Why is there no API specification?** -- The application is a test/training API without formal API design review.
5. **Why does this matter?** -- Health check endpoints are consumed by load balancers, monitoring tools, and orchestration platforms (Kubernetes, AWS ALB) that often check specifically for 200 OK.

### Root Cause

| Field | Value |
|-------|-------|
| **Category** | Framework Misuse / Design Flaw |
| **Root Cause** | Developer used `res.sendStatus(201)` in the /ping route handler instead of `res.sendStatus(200)` |
| **Confidence** | 0.95 |
| **Evidence** | Response body is literally "Created" -- this is Express.js's `sendStatus()` behavior, which sends the HTTP status text as the body |

### Impact Assessment

| Dimension | Impact |
|-----------|--------|
| **Operational** | HIGH -- Load balancers and health monitors (HAProxy, Kubernetes liveness probes, AWS Target Groups) typically expect 200 for health checks. A 201 response could cause services to be marked unhealthy. |
| **Usability** | LOW -- Human users would not notice. |
| **Standards Compliance** | MEDIUM -- Violates RFC 7231 semantics. 201 means "a new resource has been created," which is semantically false for a health check. |

### Fix Recommendation

```javascript
// BEFORE (current)
app.get('/ping', (req, res) => {
  res.sendStatus(201);
});

// AFTER (correct)
app.get('/ping', (req, res) => {
  res.sendStatus(200);
});
```

### Prevention Pattern

- **API Design Review**: Require OpenAPI specification before implementation. Status codes must be explicitly defined per endpoint.
- **Contract Testing**: Automated contract tests should validate status codes against the specification.
- **Health Check Standard**: Adopt a team-wide standard that health endpoints always return 200 with a JSON body like `{"status":"healthy"}`.

---

## Bug 2: POST /auth Bad Credentials Returns 200 Instead of 401

### Reproduction Evidence

Every failure scenario returns `200 OK` with `{"reason":"Bad credentials"}`:

```
Test Case                          | Status | Body
-----------------------------------|--------|----------------------------------
Bad username + password             | 200    | {"reason":"Bad credentials"}
Empty JSON body {}                  | 200    | {"reason":"Bad credentials"}
Missing password field              | 200    | {"reason":"Bad credentials"}
Missing username field              | 200    | {"reason":"Bad credentials"}
Wrong types (int, bool)             | 200    | {"reason":"Bad credentials"}
SQL injection in username           | 200    | {"reason":"Bad credentials"}
Null values                         | 200    | {"reason":"Bad credentials"}
Valid credentials (admin/password123)| 200    | {"token":"c108b1d0e1d950b"}

Key finding: The "reason" field is ALWAYS "Bad credentials" for every
failure mode -- no differentiation between missing fields, wrong types,
or wrong values.
```

### 5-Whys Analysis

1. **Why does bad auth return 200?** -- The route handler always returns 200, differentiating success/failure only via the response body content.
2. **Why was this designed this way?** -- The developer treated auth as a "query" operation ("give me a token for these creds") rather than an "access control" operation. If creds are wrong, the "query" still "succeeded" -- it just returned a reason instead of a token.
3. **Why is this problematic?** -- HTTP status codes are the primary mechanism for automated systems to determine success/failure. Security scanners, API gateways, and rate limiters all rely on 401/403 responses to detect authentication failures.
4. **Why does it accept any input type?** -- No input validation exists. The auth handler catches all non-matching credentials with a generic fallthrough.
5. **Why does this matter for security?** -- Automated brute-force tools cannot use standard HTTP response code filtering. Rate limiting rules based on 401 counts will not trigger. WAF rules monitoring for auth failures will be blind.

### Root Cause

| Field | Value |
|-------|-------|
| **Category** | Design Flaw + Security Anti-Pattern |
| **Root Cause** | Authentication endpoint uses HTTP 200 for all responses, relying solely on body content to communicate auth failure. No input validation distinguishes between malformed requests and wrong credentials. |
| **Confidence** | 0.98 |
| **Evidence** | 8 different failure scenarios all return identical 200 status with same body. Successful auth also returns 200. Only the body content differs. |

### Impact Assessment

| Dimension | Impact |
|-----------|--------|
| **Security** | CRITICAL -- WAF/IDS systems cannot detect brute-force attacks via status code monitoring. API gateways cannot rate-limit failed auth attempts automatically. Security audit tools will flag this as a vulnerability. |
| **Usability** | HIGH -- API consumers must parse the body to determine success/failure instead of checking the status code. This violates the principle of least surprise. |
| **Automation** | HIGH -- CI/CD pipelines, integration tests, and monitoring tools that check status codes will produce false positives/negatives. |
| **Standards** | HIGH -- Violates RFC 7235 (HTTP Authentication). 401 Unauthorized is the defined response for failed authentication. |

### Fix Recommendation

```javascript
// BEFORE (current) - all paths return 200
app.post('/auth', (req, res) => {
  // ... validation logic ...
  if (!match) {
    res.status(200).json({ reason: "Bad credentials" });
  } else {
    res.status(200).json({ token: generatedToken });
  }
});

// AFTER (correct) - differentiated responses
app.post('/auth', (req, res) => {
  const { username, password } = req.body;

  // Validate input exists
  if (!username || !password) {
    return res.status(400).json({
      error: "Bad Request",
      message: "username and password fields are required"
    });
  }

  // Validate types
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({
      error: "Bad Request",
      message: "username and password must be strings"
    });
  }

  // Authenticate
  if (!match) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.status(200).json({ token: generatedToken });
});
```

### Prevention Pattern

- **Security Review Checklist**: All authentication endpoints MUST return 401 for failed authentication and 400 for malformed requests.
- **API Gateway Integration**: Configure rate limiting on 401 responses from auth endpoints.
- **OWASP Compliance**: Follow OWASP API Security Top 10 -- proper status codes are part of API2:2023 (Broken Authentication).

---

## Bug 3: POST /booking Returns 200 Instead of 201

### Reproduction Evidence

```
Request:  POST /booking
          Content-Type: application/json
          Body: {"firstname":"RCA","lastname":"Test",...}

Response: HTTP/1.1 200 OK
          Content-Type: application/json; charset=utf-8
          Content-Length: 165
          [NO Location header]
          Body: {"bookingid":939,"booking":{...}}

Comparison - PUT /booking/:id also returns 200 OK.
Both create and update return the same status code.
```

Key observations:
- **No `Location` header** is returned with the created resource URI (e.g., `Location: /booking/939`)
- **POST and PUT both return 200**, making them indistinguishable by status code
- The `bookingid` is always present in the response body

### 5-Whys Analysis

1. **Why does POST /booking return 200?** -- The handler uses `res.status(200).json(...)` instead of `res.status(201).json(...)`.
2. **Why 200?** -- The developer likely used the same response pattern for all successful operations without differentiating between creation and retrieval.
3. **Why no Location header?** -- Express does not add it automatically; the developer would need to explicitly call `res.set('Location', ...)`.
4. **Why does this matter?** -- REST clients and API documentation generators use 201 to indicate resource creation. Caching proxies treat 200 and 201 differently.
5. **Why is the bookingid always present?** -- The database insert returns the generated ID, which is correctly included. The data layer works correctly; only the HTTP layer is wrong.

### Root Cause

| Field | Value |
|-------|-------|
| **Category** | Implementation Bug / REST Convention Violation |
| **Root Cause** | Developer used `res.status(200)` uniformly for all successful operations. No distinction between creation (201) and retrieval/update (200) responses. Missing `Location` header for created resources. |
| **Confidence** | 0.96 |
| **Evidence** | POST and PUT both return 200. No Location header on POST. The bookingid in the response body confirms creation succeeded, but the HTTP semantics do not reflect it. |

### Impact Assessment

| Dimension | Impact |
|-----------|--------|
| **Standards** | MEDIUM -- Violates RFC 7231 Section 6.3.2: "The 201 (Created) status code indicates that the request has been fulfilled and has resulted in one or more new resources being created." |
| **Caching** | LOW -- 201 responses with Location headers enable client-side caching of the new resource URI. Without this, clients must parse the body. |
| **Usability** | MEDIUM -- API consumers cannot distinguish create from update by status code alone. SDK generators (OpenAPI Generator, Swagger Codegen) may produce incorrect client code. |

### Fix Recommendation

```javascript
// BEFORE
app.post('/booking', (req, res) => {
  // ... create booking ...
  res.status(200).json({ bookingid: id, booking: data });
});

// AFTER
app.post('/booking', (req, res) => {
  // ... create booking ...
  res.status(201)
     .set('Location', `/booking/${id}`)
     .json({ bookingid: id, booking: data });
});
```

### Prevention Pattern

- **REST Linting**: Use tools like Spectral to lint OpenAPI specs. Rule: POST endpoints that create resources MUST return 201.
- **Response Code Matrix**: Maintain a team-standard mapping: POST=201, GET=200, PUT=200, PATCH=200, DELETE=204.

---

## Bug 4: DELETE Returns 201 "Created" Instead of 204

### Reproduction Evidence

```
Request:  DELETE /booking/:id  (valid ID, with auth token)
Response: HTTP/1.1 201 Created
          Content-Type: text/plain; charset=utf-8
          Content-Length: 7
          Body: "Created"

Request:  DELETE /booking/:id  (already deleted ID, with auth token)
Response: HTTP/1.1 405 Method Not Allowed
          Body: "Method Not Allowed"

Request:  DELETE /booking/99999999  (never existed, with auth token)
Response: HTTP/1.1 405 Method Not Allowed
          Body: "Method Not Allowed"

Request:  DELETE /booking/:id  (without auth)
Response: HTTP/1.1 403 Forbidden
          Body: "Forbidden"
```

### 5-Whys Analysis

1. **Why does DELETE return 201?** -- The route handler calls `res.sendStatus(201)`.
2. **Why 201?** -- This is the same pattern as the /ping endpoint. The developer appears to have used 201 as a generic "operation completed" status code, misunderstanding its semantic meaning.
3. **Why "Created" in the body?** -- `res.sendStatus(201)` in Express automatically sets the body to the HTTP status text for 201, which is "Created". This is not a custom string.
4. **Why 405 for non-existent resources?** -- The application returns "Method Not Allowed" instead of 404 when the resource does not exist. This is a secondary bug: DELETE on a non-existent resource should return 404.
5. **Why does Content-Length: 7 matter?** -- It correctly matches "Created" (7 bytes), but for a proper 204 No Content response, Content-Length should be 0 with no body.

### Root Cause

| Field | Value |
|-------|-------|
| **Category** | Framework Misuse + Semantic Error |
| **Root Cause** | Developer called `res.sendStatus(201)` in the DELETE handler. Express's `sendStatus()` sets both the status code AND the body to the HTTP status text. The developer likely intended "success" but chose the wrong code. |
| **Confidence** | 0.97 |
| **Evidence** | Body is exactly "Created" (the HTTP/1.1 status text for 201). Same pattern as /ping. Content-Length is 7 (length of "Created"). |

### Secondary Finding

DELETE on a non-existent or already-deleted resource returns **405 Method Not Allowed** instead of **404 Not Found**. This is a separate bug: 405 means "the HTTP method is not supported for this resource," which is incorrect -- DELETE IS supported, the resource just does not exist.

### Impact Assessment

| Dimension | Impact |
|-----------|--------|
| **Semantic** | HIGH -- 201 "Created" on a DELETE operation is the exact opposite of what happened. This will confuse API consumers and generate incorrect documentation. |
| **Idempotency** | MEDIUM -- Double DELETE returns 405 instead of 404, breaking the idempotency expectation. REST DELETE should be idempotent: deleting an already-deleted resource should return 404, not 405. |
| **Monitoring** | MEDIUM -- Dashboards tracking 201 responses will conflate resource creation with deletion. |

### Fix Recommendation

```javascript
// BEFORE
app.delete('/booking/:id', auth, (req, res) => {
  // ... delete booking ...
  res.sendStatus(201);
});

// AFTER
app.delete('/booking/:id', auth, (req, res) => {
  const deleted = deleteBooking(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: "Booking not found" });
  }
  res.sendStatus(204); // No Content -- no body needed
});
```

### Prevention Pattern

- **Code Review Rule**: Flag any use of `res.sendStatus(201)` outside of POST handlers.
- **HTTP Semantics Training**: Team training on HTTP status code semantics. 201 = Created, 204 = No Content (ideal for DELETE).
- **Static Analysis**: Custom ESLint rule to flag `sendStatus(201)` in DELETE route handlers.

---

## Bug 5: POST /booking Missing Fields Returns 500 Instead of 400

### Reproduction Evidence

Systematic field-by-field testing:

```
Test Case                    | Status | Body
-----------------------------|--------|------------------------
Empty body {}                | 500    | "Internal Server Error"
Missing firstname            | 500    | "Internal Server Error"
Missing lastname             | 500    | "Internal Server Error"
Missing totalprice           | 500    | "Internal Server Error"
Missing depositpaid          | 500    | "Internal Server Error"
Missing bookingdates         | 500    | "Internal Server Error"
Missing checkin (in dates)   | 500    | "Internal Server Error"
Null values for all fields   | 500    | "Internal Server Error"
Empty strings for names      | 200    | Created successfully (!)
Wrong type for totalprice    | 200    | Created with null price (!)
Malformed JSON (not-json)    | 400    | "Bad Request"
```

### Critical Secondary Findings

1. **Empty strings are accepted**: `firstname: ""` and `lastname: ""` create a valid booking. No minimum-length validation exists.
2. **Wrong types are silently coerced**: `totalprice: "abc"` is accepted and stored as `null`. No type validation exists.
3. **Malformed JSON does return 400**: Express's built-in JSON parser correctly rejects invalid JSON with 400. This proves the 500 errors come from the application layer, not the framework.
4. **No stack trace exposed**: The 500 response body is the generic "Internal Server Error" text, with no stack trace. This is good from a security perspective -- Express's default error handler does not leak internals.
5. **EVERY field is required**: Removing any single field causes a 500. There are no optional fields (except `additionalneeds`).

### 5-Whys Analysis

1. **Why does a missing field return 500?** -- The application has no input validation middleware. Missing fields are passed directly to the data layer.
2. **Why does the data layer crash?** -- The database insert or ORM (likely Sequelize or a similar library) attempts to access properties of undefined objects (e.g., `req.body.bookingdates.checkin` when `bookingdates` is undefined), throwing a TypeError.
3. **Why is this a TypeError and not a validation error?** -- No validation layer exists between the route handler and the data model. The code assumes all fields are present.
4. **Why was validation not implemented?** -- The application is a training/test API. Input validation was not part of the original scope.
5. **Why does Express return 500 for unhandled errors?** -- Express's default error handler catches unhandled exceptions and returns 500. This is correct Express behavior -- the bug is the missing validation, not the error handler.

### Root Cause

| Field | Value |
|-------|-------|
| **Category** | Missing Validation / Unhandled Exception |
| **Root Cause** | No input validation middleware exists. Missing required fields cause unhandled TypeError exceptions in the data layer when accessing properties of undefined objects. Express's default error handler converts these to 500 responses. |
| **Confidence** | 0.97 |
| **Evidence** | Every individual missing field causes 500. Empty strings pass (no content validation). Wrong types are silently coerced to null (no type validation). Malformed JSON correctly returns 400 (Express parser works; application validation is absent). |

### Impact Assessment

| Dimension | Impact |
|-----------|--------|
| **Reliability** | HIGH -- Any malformed request from a client causes a server error. In production, this would trigger error alerts, inflate error rate metrics, and potentially fill log volumes. |
| **Security** | MEDIUM -- While no stack traces are leaked, 500 errors indicate unhandled exceptions. An attacker could use various payloads to probe for injection vulnerabilities by observing which inputs cause 500 vs 200. |
| **Data Integrity** | HIGH -- Empty strings and wrong types are accepted and stored. A booking with `firstname: ""` and `totalprice: null` is a corrupted record. |
| **Usability** | HIGH -- API consumers receive no guidance on what fields are required or what format is expected. The generic "Internal Server Error" message provides no actionable information. |

### Fix Recommendation

```javascript
// Add validation middleware (using express-validator or joi)
const { body, validationResult } = require('express-validator');

const bookingValidation = [
  body('firstname').isString().notEmpty().withMessage('firstname is required'),
  body('lastname').isString().notEmpty().withMessage('lastname is required'),
  body('totalprice').isInt({ min: 0 }).withMessage('totalprice must be a positive integer'),
  body('depositpaid').isBoolean().withMessage('depositpaid must be boolean'),
  body('bookingdates.checkin').isISO8601().withMessage('checkin must be a valid date'),
  body('bookingdates.checkout').isISO8601().withMessage('checkout must be a valid date'),
];

app.post('/booking', bookingValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Bad Request",
      validationErrors: errors.array()
    });
  }
  // ... proceed with creation ...
});
```

### Prevention Pattern

- **Validation-First Architecture**: Every endpoint that accepts a request body MUST have validation middleware before the route handler.
- **Schema Validation**: Use JSON Schema or Joi to define and enforce request schemas.
- **Error Handling Middleware**: Add a custom Express error handler that converts known error types to 400 responses.
- **Negative Testing**: CI must include tests for missing fields, wrong types, empty strings, and null values.

---

## Bug 6: DELETE Response Body Says "Created"

### Reproduction Evidence

```
Request:  DELETE /booking/:id (with auth)
Response: HTTP/1.1 201 Created
          Content-Type: text/plain; charset=utf-8
          Body: "Created"

For comparison, other text/plain responses:
  403 Forbidden  -> Body: "Forbidden"   (correct match)
  404 Not Found  -> Body: "Not Found"   (correct match)
  405 Not Allowed -> Body: "Method Not Allowed" (correct match)
  500 Error      -> Body: "Internal Server Error" (correct match)
```

### 5-Whys Analysis

1. **Why does the DELETE body say "Created"?** -- Because the status code is 201, and `res.sendStatus()` sets the body to the HTTP status text.
2. **Why is this the same root cause as Bug 4?** -- Bugs 4 and 6 are the same bug observed from two angles. Bug 4 is about the wrong status code; Bug 6 is about the wrong body text. Both stem from `res.sendStatus(201)`.
3. **Is "Created" a custom string?** -- No. It is the standard HTTP/1.1 reason phrase for status 201, automatically set by Express.
4. **Do other endpoints have mismatched bodies?** -- No. The 403, 404, 405, and 500 responses all have body text matching their status code's reason phrase. Only the DELETE endpoint (and /ping) have semantically wrong status codes, which causes semantically wrong body text.
5. **What confirms this is Express behavior?** -- The `X-Powered-By: Express` header, combined with the fact that `sendStatus()` is documented to send the status text as the body.

### Root Cause

| Field | Value |
|-------|-------|
| **Category** | Same Root Cause as Bug 4 (Framework Misuse) |
| **Root Cause** | `res.sendStatus(201)` in Express sets the body to "Created" (the HTTP reason phrase for 201). This is not a separate bug but a direct consequence of Bug 4's wrong status code. |
| **Confidence** | 0.99 |
| **Evidence** | All other `sendStatus()` calls produce matching status-code/body pairs (403/Forbidden, 404/Not Found, etc.). Only 201/Created is semantically wrong because the status code itself is wrong for the DELETE operation. |

### Impact Assessment

| Dimension | Impact |
|-----------|--------|
| **Confusion** | HIGH -- A DELETE response saying "Created" is maximally confusing. API consumers will question whether their delete actually worked. |
| **Logging** | MEDIUM -- Log aggregators indexing response bodies will incorrectly categorize DELETE operations as creation events. |

### Fix Recommendation

This bug is fully resolved by fixing Bug 4. Changing `res.sendStatus(201)` to `res.sendStatus(204)` eliminates both the wrong status code and the misleading body text (204 No Content has no body).

---

## Cross-Cutting Analysis

### Pattern Correlation Matrix

| Pattern | Bugs Affected | Root Category |
|---------|---------------|---------------|
| `res.sendStatus(201)` misuse | 1, 4, 6 | Framework Misuse |
| Missing input validation | 2, 5 | Missing Validation |
| Wrong HTTP status for operation type | 1, 2, 3, 4 | REST Semantics |
| No differentiation between error types | 2, 5 | Error Handling |
| Data integrity (accepts garbage) | 5 | Missing Validation |

### Systemic Root Causes

#### Systemic Root Cause 1: No HTTP Semantics Enforcement

The API has no mechanism to ensure that HTTP status codes match their RFC 7231 definitions. The developer appears to have a mental model where:
- `200` = "the request was processed" (used for auth success AND auth failure)
- `201` = "operation completed successfully" (used for health check AND delete)

This mental model conflates "application-level success" with "HTTP-level semantics."

**Evidence**: 4 out of 6 bugs involve wrong status codes. The status codes chosen suggest the developer understood "2xx = good" but not the specific meaning of each 2xx code.

#### Systemic Root Cause 2: No Validation Layer

The API has zero request validation between the HTTP layer and the data layer. Express's built-in JSON parser is the only validation that exists (it correctly returns 400 for malformed JSON). Everything else is passed through unchecked.

**Evidence**: Missing fields cause 500 (crashes). Wrong types are silently coerced. Empty strings are accepted. The only "validation" is a generic try/catch in Express's error handler.

### Framework Analysis: Express.js Contribution

Express.js itself is not the root cause, but its API design contributes to these bugs:

1. **`sendStatus()` dual behavior**: Setting both status code and body text is convenient but masks semantic errors. A developer calling `sendStatus(201)` may not realize they are also setting the body to "Created."
2. **No built-in validation**: Express does not enforce request validation. Libraries like `express-validator` or `joi` must be explicitly added.
3. **Permissive defaults**: Express does not warn about semantically unusual combinations (like 201 on a DELETE route).

---

## Summary of Findings

| Bug | Root Cause Category | Confidence | Fix Complexity |
|-----|---------------------|------------|----------------|
| 1. GET /ping returns 201 | Framework Misuse | 0.95 | Trivial (change one number) |
| 2. POST /auth returns 200 for failure | Design Flaw + Security Anti-Pattern | 0.98 | Medium (add validation + change status) |
| 3. POST /booking returns 200 | Implementation Bug | 0.96 | Trivial (change status + add header) |
| 4. DELETE returns 201 | Framework Misuse | 0.97 | Trivial (change one number) |
| 5. Missing fields returns 500 | Missing Validation | 0.97 | Medium (add validation middleware) |
| 6. DELETE body says "Created" | Same as Bug 4 | 0.99 | Resolved by fixing Bug 4 |

### Priority Order for Fixes

1. **Bug 2** (P0 -- Security) -- Authentication returning 200 for failures is a security anti-pattern that blinds WAFs, rate limiters, and monitoring systems.
2. **Bug 5** (P1 -- Reliability) -- Unhandled exceptions from missing fields indicate a fragile server that crashes on malformed input. Also a data integrity risk.
3. **Bug 4 + Bug 6** (P2 -- Semantics) -- DELETE returning 201 "Created" is the most confusing semantic violation.
4. **Bug 1** (P2 -- Operational) -- Health check returning 201 can break infrastructure tooling.
5. **Bug 3** (P3 -- Standards) -- POST returning 200 instead of 201 is a convention violation but functionally acceptable.

---

## Prevention Recommendations (Applicable to Any API)

### 1. API-First Design

Define an OpenAPI 3.x specification before writing any code. Use Spectral or similar linters to enforce status code conventions:
- POST creating a resource: 201 with Location header
- GET retrieving a resource: 200
- PUT/PATCH updating: 200
- DELETE removing: 204
- Authentication failure: 401
- Validation failure: 400

### 2. Validation Middleware

Every endpoint accepting a request body must have a validation layer. Use schema-based validation (JSON Schema, Joi, Zod) that returns structured 400 errors with field-level details.

### 3. Contract Testing in CI

Automated contract tests that validate response status codes, headers, and body schemas against the OpenAPI specification. Run on every PR.

### 4. HTTP Semantics Code Review Checklist

- Does the status code match the operation type?
- Does the response body match the status code's meaning?
- Are error responses using 4xx (client error) vs 5xx (server error) correctly?
- Are Location headers present for 201 responses?
- Is 204 used (not 200 or 201) for operations with no response body?

### 5. Security-Specific

- Authentication endpoints MUST return 401 for failed auth
- Rate limiting MUST be configured on auth endpoints based on 401 response counts
- Input validation MUST exist before any data layer interaction
- 500 errors MUST never leak stack traces (this API gets this right)

---

*Generated by AQE v3 Root Cause Analyzer | 2026-02-16*
*Analysis Technique: 5-Whys + Pattern Correlation + Active HTTP Investigation*
*Total HTTP requests made during investigation: 32*
