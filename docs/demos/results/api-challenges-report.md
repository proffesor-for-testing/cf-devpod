# Evil Tester API Challenges - Integration Test Report

**Date**: 2026-02-16T10:22:58.343Z
**Base URL**: https://apichallenges.eviltester.com
**Challenger Token**: `4d4e1aaa-10e0-4739-9709-3c3e9c7fb0bd`
**Test Runner**: AQE v3 Integration Tester (Node.js native fetch)

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | 19 |
| Passed | 19 |
| Failed | 0 |
| Pass Rate | 100.0% |
| Total Response Time | 2352ms |
| Avg Response Time | 124ms |
| Challenges Completed | 17/59 |

## Detailed Results

| # | Test | Status | Time (ms) | Notes |
|---|------|--------|-----------|-------|
| 1 | POST /challenger - create session | PASS | 350 |  |
| 2 | GET /todos - list all todos | PASS | 268 |  |
| 3 | POST /todos - create a todo | PASS | 90 |  |
| 4 | GET /todos/:id - get created todo | PASS | 89 |  |
| 5 | PUT /todos/:id - update (mark done) | PASS | 88 |  |
| 6 | DELETE /todos/:id - delete todo | PASS | 88 |  |
| 7 | GET /todos/:id - verify 404 after delete | PASS | 85 |  |
| 8 | GET /todos Accept: application/json | PASS | 87 |  |
| 9 | GET /todos Accept: application/xml | PASS | 87 |  |
| 10 | POST /todos Content-Type: application/json | PASS | 175 |  |
| 11 | POST /todos Content-Type: application/xml | PASS | 174 |  |
| 12 | POST /secret/token without auth - expect 401 | PASS | 86 |  |
| 13 | POST /secret/token with valid basic auth | PASS | 84 |  |
| 14 | GET /secret/note with X-AUTH-TOKEN | PASS | 86 |  |
| 15 | GET /secret/note without token - expect 401 | PASS | 85 |  |
| 16 | POST /todos with title > 50 chars - expect 400 | PASS | 88 |  |
| 17 | POST /todos with invalid doneStatus type - expect 400 | PASS | 87 |  |
| 18 | POST /todos with missing title - expect 400 | PASS | 87 |  |
| 19 | GET /challenges - check progress | PASS | 168 |  |

## Test Categories

### 1. Session Creation
- Verified POST /challenger returns 201 with X-CHALLENGER token
- Token used for all subsequent requests

### 2. TODO CRUD Operations
- Full lifecycle: Create -> Read -> Update -> Delete -> Verify deletion
- Validated response schemas and status codes at each step

### 3. Content Negotiation
- JSON request/response via Accept and Content-Type headers
- XML request/response via Accept and Content-Type headers
- Verified content-type headers in responses match requested format

### 4. Authentication
- POST /secret/token with Basic auth (admin/password) to obtain X-AUTH-TOKEN
- 401 response when POST /secret/token without credentials
- 401 response when accessing GET /secret/note without token
- Successful GET /secret/note with valid X-AUTH-TOKEN

### 5. Validation
- Title exceeding 50 character max length rejected with 400
- Invalid doneStatus type (string instead of boolean) rejected with 400
- Missing required title field rejected with 400
- Verified errorMessages present in all 400 responses

### 6. Challenges Progress

Completed **17** of **59** challenges.

<details>
<summary>Completed challenges (17)</summary>

- **POST /challenger (201)**: Issue a POST request on the `/challenger` end point, with no body, to create a new challenger session. Use the generated X-CHALLENGER header in future requests to track challenge completion.
- **GET /challenges (200)**: Issue a GET request on the `/challenges` end point
- **GET /todos (200)**: Issue a GET request on the `/todos` end point
- **GET /todos/{id} (200)**: Issue a GET request on the `/todos/{id}` end point to return a specific todo
- **GET /todos/{id} (404)**: Issue a GET request on the `/todos/{id}` end point for a todo that does not exist
- **POST /todos (201)**: Issue a POST request to successfully create a todo
- **POST /todos (400) doneStatus**: Issue a POST request to create a todo but fail validation on the `doneStatus` field
- **POST /todos (400) title too long**: Issue a POST request to create a todo but fail length validation on the `title` field because your title exceeds maximum allowable characters.
- **PUT /todos/{id} full (200)**: Issue a PUT request to update an existing todo with a complete payload i.e. title, description and donestatus.
- **DELETE /todos/{id} (200)**: Issue a DELETE request to successfully delete a todo
- **GET /todos (200) XML**: Issue a GET request on the `/todos` end point with an `Accept` header of `application/xml` to receive results in XML format
- **GET /todos (200) JSON**: Issue a GET request on the `/todos` end point with an `Accept` header of `application/json` to receive results in JSON format
- **POST /todos XML**: Issue a POST request on the `/todos` end point to create a todo using Content-Type `application/xml`, and Accepting only XML ie. Accept header of `application/xml`
- **POST /todos JSON**: Issue a POST request on the `/todos` end point to create a todo using Content-Type `application/json`, and Accepting only JSON ie. Accept header of `application/json`
- **POST /secret/token (201)**: Issue a POST request on the `/secret/token` end point and receive 201 when Basic auth username/password is admin/password
- **GET /secret/note (401)**: Issue a GET request on the `/secret/note` end point and receive 401 when no X-AUTH-TOKEN header present
- **GET /secret/note (200)**: Issue a GET request on the `/secret/note` end point receive 200 when valid X-AUTH-TOKEN used - response body should contain the note

</details>

## Response Time Analysis

| Metric | Value |
|--------|-------|
| Min | 84ms |
| Max | 350ms |
| Median | 88ms |
| P95 | 350ms |

---
*Generated by AQE v3 Integration Tester - 2026-02-16T10:22:58.343Z*
