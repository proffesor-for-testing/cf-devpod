# Restful Booker API - Contract Test Report

**Date**: 2026-02-16T10:14:11.061Z
**Base URL**: https://restful-booker.herokuapp.com
**Tool**: AQE v3 Contract Validator (Node.js v24.13.0, native fetch)
**Total Tests**: 13 | **Passed**: 11 | **Failed**: 2

---

## Test Results

| # | Test | Method | Endpoint | Expected | Actual | Status | Content-Type | Schema | Time |
|---|------|--------|----------|----------|--------|--------|--------------|--------|------|
| 1 | Health Check | GET | /ping | 201 | 201 | OK | OK | OK | 436ms |
| 2 | Create Auth Token | POST | /auth | 200 | 200 | OK | OK | OK | 287ms |
| 3 | Auth - Bad Credentials | POST | /auth | 401 | 200 | FAIL | OK | OK | 91ms |
| 4 | List Bookings | GET | /booking | 200 | 200 | OK | OK | OK | 96ms |
| 5 | Get Booking | GET | /booking/1315 | 200 | 200 | OK | OK | OK | 91ms |
| 6 | Create Booking | POST | /booking | 200 | 200 | OK | OK | OK | 93ms |
| 7 | Update Booking | PUT | /booking/1965 | 200 | 200 | OK | OK | OK | 93ms |
| 8 | Partial Update Booking | PATCH | /booking/1965 | 200 | 200 | OK | OK | OK | 94ms |
| 9 | Delete Booking | DELETE | /booking/1965 | 201 | 201 | OK | OK | OK | 91ms |
| 10 | Verify Deletion | GET | /booking/1965 | 404 | 404 | OK | OK | OK | 94ms |
| 11 | Get Non-Existent Booking | GET | /booking/99999999 | 404 | 404 | OK | OK | OK | 91ms |
| 12 | Create Booking - Missing Fields | POST | /booking | 400 | 500 | FAIL | FAIL | OK | 94ms |
| 13 | Update Without Auth | PUT | /booking/1315 | 403 | 403 | OK | OK | OK | 90ms |

---

## Detailed Results

### PASS: Health Check

- **Request**: `GET /ping`
- **Expected Status**: 201 | **Actual**: 201
- **Content-Type**: `text/plain; charset=utf-8`
- **Response Time**: 436ms
- **Response Body** (truncated):
```json
Created
```

### PASS: Create Auth Token

- **Request**: `POST /auth`
- **Expected Status**: 200 | **Actual**: 200
- **Content-Type**: `application/json; charset=utf-8`
- **Response Time**: 287ms
- **Response Body** (truncated):
```json
{"token":"62d19a8d834c907"}
```

### FAIL: Auth - Bad Credentials

- **Request**: `POST /auth`
- **Expected Status**: 401 | **Actual**: 200
- **Content-Type**: `application/json; charset=utf-8`
- **Response Time**: 91ms
- **Errors**:
  - Status: expected 401, got 200
- **Response Body** (truncated):
```json
{"reason":"Bad credentials"}
```

### PASS: List Bookings

- **Request**: `GET /booking`
- **Expected Status**: 200 | **Actual**: 200
- **Content-Type**: `application/json; charset=utf-8`
- **Response Time**: 96ms
- **Response Body** (truncated):
```json
[{"bookingid":1315},{"bookingid":45},{"bookingid":1190},{"bookingid":824},{"bookingid":738},{"bookingid":542},{"bookingid":181},{"bookingid":296},{"bookingid":1470},{"bookingid":1627},{"bookingid":614},{"bookingid":1593},{"bookingid":808},{"bookingid":441},{"bookingid":933},{"bookingid":471},{"bookingid":556},{"bookingid":1774},{"bookingid":1166},{"bookingid":869},{"bookingid":724},{"bookingid":1675},{"bookingid":1526},{"bookingid":1346},{"bookingid":306},{"bookingid":1295},{"bookingid":72},{"bo
```

### PASS: Get Booking

- **Request**: `GET /booking/1315`
- **Expected Status**: 200 | **Actual**: 200
- **Content-Type**: `application/json; charset=utf-8`
- **Response Time**: 91ms
- **Response Body** (truncated):
```json
{"firstname":"Josh","lastname":"Allen","totalprice":111,"depositpaid":true,"bookingdates":{"checkin":"2018-01-01","checkout":"2019-01-01"},"additionalneeds":"super bowls"}
```

### PASS: Create Booking

- **Request**: `POST /booking`
- **Expected Status**: 200 | **Actual**: 200
- **Content-Type**: `application/json; charset=utf-8`
- **Response Time**: 93ms
- **Response Body** (truncated):
```json
{"bookingid":1965,"booking":{"firstname":"AQE","lastname":"ContractTest","totalprice":250,"depositpaid":true,"bookingdates":{"checkin":"2026-03-01","checkout":"2026-03-10"},"additionalneeds":"Breakfast"}}
```

### PASS: Update Booking

- **Request**: `PUT /booking/1965`
- **Expected Status**: 200 | **Actual**: 200
- **Content-Type**: `application/json; charset=utf-8`
- **Response Time**: 93ms
- **Response Body** (truncated):
```json
{"firstname":"Updated","lastname":"ContractTest","totalprice":999,"depositpaid":true,"bookingdates":{"checkin":"2026-03-01","checkout":"2026-03-10"},"additionalneeds":"Breakfast"}
```

### PASS: Partial Update Booking

- **Request**: `PATCH /booking/1965`
- **Expected Status**: 200 | **Actual**: 200
- **Content-Type**: `application/json; charset=utf-8`
- **Response Time**: 94ms
- **Response Body** (truncated):
```json
{"firstname":"Patched","lastname":"ContractTest","totalprice":999,"depositpaid":true,"bookingdates":{"checkin":"2026-03-01","checkout":"2026-03-10"},"additionalneeds":"Breakfast"}
```

### PASS: Delete Booking

- **Request**: `DELETE /booking/1965`
- **Expected Status**: 201 | **Actual**: 201
- **Content-Type**: `text/plain; charset=utf-8`
- **Response Time**: 91ms
- **Response Body** (truncated):
```json
Created
```

### PASS: Verify Deletion

- **Request**: `GET /booking/1965`
- **Expected Status**: 404 | **Actual**: 404
- **Content-Type**: `text/plain; charset=utf-8`
- **Response Time**: 94ms
- **Response Body** (truncated):
```json
Not Found
```

### PASS: Get Non-Existent Booking

- **Request**: `GET /booking/99999999`
- **Expected Status**: 404 | **Actual**: 404
- **Content-Type**: `text/plain; charset=utf-8`
- **Response Time**: 91ms
- **Response Body** (truncated):
```json
Not Found
```

### FAIL: Create Booking - Missing Fields

- **Request**: `POST /booking`
- **Expected Status**: 400 | **Actual**: 500
- **Content-Type**: `text/plain; charset=utf-8`
- **Response Time**: 94ms
- **Errors**:
  - Failed to parse JSON: Internal Server Error
  - Status: expected 400, got 500
  - Content-Type: expected to include "application/json", got "text/plain; charset=utf-8"
- **Response Body** (truncated):
```json
Internal Server Error
```

### PASS: Update Without Auth

- **Request**: `PUT /booking/1315`
- **Expected Status**: 403 | **Actual**: 403
- **Content-Type**: `text/plain; charset=utf-8`
- **Response Time**: 90ms
- **Response Body** (truncated):
```json
Forbidden
```

---

## Bugs and Unexpected Behaviors

| # | Endpoint | Issue |
|---|----------|-------|
| 1 | `GET /ping` | Returns 201 Created for a health check instead of 200 OK. Health checks should return 200. |
| 2 | `POST /auth (bad creds)` | Returns 200 instead of 401 for invalid credentials. Body: {"reason":"Bad credentials"} |
| 3 | `POST /booking` | Returns 200 OK instead of 201 Created for resource creation. |
| 4 | `DELETE /booking/:id` | Returns 201 Created for a DELETE operation instead of 200 OK or 204 No Content. |
| 5 | `POST /booking` (missing fields) | Returns 500 Internal Server Error instead of 400 Bad Request when required fields are missing. No input validation. |
| 6 | `DELETE /booking/:id` | Response body is "Created" for a delete operation -- misleading response text. |

---

## Contract Schema Expectations

### POST /auth Response
```json
{ "token": "string" }
```

### GET /booking Response (array of)
```json
{ "bookingid": "number" }
```

### GET /booking/:id Response
```json
{
  "firstname": "string",
  "lastname": "string",
  "totalprice": "number",
  "depositpaid": "boolean",
  "bookingdates": {
    "checkin": "string",
    "checkout": "string"
  }
}
```

### POST /booking Response
```json
{
  "bookingid": "number",
  "booking": { /* same as GET /booking/:id */ }
}
```

---

*Generated by AQE v3 Contract Validator*
