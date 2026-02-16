# Countries GraphQL API - Test Report

**Endpoint**: `https://countries.trevorblades.com/`
**Date**: 2026-02-16T10:22:16.999Z
**Node.js**: v24.13.0

---

## Summary

| Metric | Value |
|--------|-------|
| Total Assertions | 64 |
| Passed | 64 |
| Failed | 0 |
| Warnings | 2 |
| Pass Rate | 100.0% |

---

## Performance Summary

| Query | Response Time |
|-------|--------------|
| Schema Introspection | 187ms |
| Get All Continents | 54ms |
| Get All Countries | 70ms |
| Get All Languages | 49ms |
| Get Continent (EU) with Countries | 53ms |
| Get Country (US) Detail | 55ms |
| Get Language (en) | 65ms |
| Countries by Currency (EUR) | 50ms |
| Countries by Continent Filter (EU) | 49ms |
| Invalid Country Code (ZZZ) | 69ms |
| Invalid Field Name | 67ms |
| Empty Query | 16ms |
| Malformed GraphQL Syntax | 20ms |
| Introspection Check | 66ms |
| Deep Nesting Test (depth=5) | 87ms |
| **Average** | **64ms** |

---

## Detailed Results

### 1. Schema Introspection

#### Schema Introspection `[PASS]` (187ms)

- PASS: HTTP status is 200
- PASS: No network error
- PASS: Response has __schema data
- PASS: Schema has Country type
- PASS: Schema has Continent type
- PASS: Schema has Language type
- PASS: Schema has 23 types (>10)
- PASS: Has 12 OBJECT types
- PASS: Has 5 SCALAR types

<details>
<summary>Response Data</summary>

```json
{
  "typesCount": 23,
  "sampleTypes": [
    "Boolean",
    "Continent",
    "ContinentFilterInput",
    "Country",
    "CountryFilterInput",
    "Float",
    "ID",
    "Int",
    "Language",
    "LanguageFilterInput"
  ]
}
```
</details>

### 2. Basic Queries

#### Get All Continents `[PASS]` (54ms)

- PASS: HTTP 200
- PASS: continents is array
- PASS: Got 7 continents (expect 7)
- PASS: All continents have code and name
- PASS: Contains EU continent
- PASS: Contains NA continent

<details>
<summary>Response Data</summary>

```json
{
  "count": 7,
  "sample": [
    {
      "code": "AF",
      "name": "Africa"
    },
    {
      "code": "AN",
      "name": "Antarctica"
    },
    {
      "code": "AS",
      "name": "Asia"
    }
  ]
}
```
</details>

#### Get All Countries `[PASS]` (70ms)

- PASS: HTTP 200
- PASS: countries is array
- PASS: Got 250 countries (>200)
- PASS: First country has code field
- PASS: First country has name field
- PASS: 245 countries have capital (>100)
- PASS: 249 countries have currency (>100)

<details>
<summary>Response Data</summary>

```json
{
  "count": 250,
  "sample": [
    {
      "code": "AD",
      "capital": "Andorra la Vella",
      "currency": "EUR",
      "name": "Andorra"
    },
    {
      "code": "AE",
      "capital": "Abu Dhabi",
      "currency": "AED",
      "name": "United Arab Emirates"
    },
    {
      "code": "AF",
      "capital": "Kabul",
      "currency": "AFN",
      "name": "Afghanistan"
    }
  ]
}
```
</details>

#### Get All Languages `[PASS]` (49ms)

- PASS: HTTP 200
- PASS: languages is array
- PASS: Got 114 languages (>50)
- PASS: All languages have code and name

<details>
<summary>Response Data</summary>

```json
{
  "count": 114,
  "sample": [
    {
      "code": "af",
      "name": "Afrikaans"
    },
    {
      "code": "am",
      "name": "Amharic"
    },
    {
      "code": "ar",
      "name": "Arabic"
    }
  ]
}
```
</details>

### 3. Filtered Queries

#### Get Continent (EU) with Countries `[PASS]` (53ms)

- PASS: HTTP 200
- PASS: Continent name is "Europe" (expect Europe)
- PASS: EU has 53 countries (>30)
- PASS: EU contains Germany (DE)
- PASS: EU contains France (FR)
- PASS: All EU countries have code and name

<details>
<summary>Response Data</summary>

```json
{
  "countriesCount": 53
}
```
</details>

#### Get Country (US) Detail `[PASS]` (55ms)

- PASS: HTTP 200
- PASS: Name is "United States"
- PASS: Capital is "Washington D.C."
- PASS: Currency includes USD: "USD,USN,USS"
- PASS: Continent is "North America"
- PASS: languages is array
- PASS: Languages include English

<details>
<summary>Response Data</summary>

```json
{
  "country": {
    "capital": "Washington D.C.",
    "currency": "USD,USN,USS",
    "languages": [
      {
        "name": "English"
      }
    ],
    "continent": {
      "name": "North America"
    },
    "name": "United States"
  }
}
```
</details>

#### Get Language (en) `[PASS]` (65ms)

- PASS: HTTP 200
- PASS: Name is "English"
- PASS: native is string: "English"
- PASS: rtl is false for English

<details>
<summary>Response Data</summary>

```json
{
  "language": {
    "name": "English",
    "native": "English",
    "rtl": false
  }
}
```
</details>

### 4. Filter Argument Testing

#### Countries by Currency (EUR) `[PASS]` (50ms)

- PASS: HTTP 200
- PASS: 35 countries use EUR (>10)
- PASS: All returned countries have EUR currency
- PASS: EUR countries include Germany
- PASS: EUR countries include France

<details>
<summary>Response Data</summary>

```json
{
  "count": 35,
  "sample": [
    {
      "currency": "EUR",
      "name": "Andorra"
    },
    {
      "currency": "EUR",
      "name": "Austria"
    },
    {
      "currency": "EUR",
      "name": "Åland"
    },
    {
      "currency": "EUR",
      "name": "Belgium"
    },
    {
      "currency": "EUR",
      "name": "Saint Barthélemy"
    }
  ]
}
```
</details>

#### Countries by Continent Filter (EU) `[PASS]` (49ms)

- PASS: HTTP 200
- PASS: 53 countries in EU filter (>30)
- PASS: Filtered EU includes Germany
- PASS: Filtered EU includes France

<details>
<summary>Response Data</summary>

```json
{
  "count": 53
}
```
</details>

### 5. Edge Cases & Error Handling

#### Invalid Country Code (ZZZ) `[PASS]` (69ms)

- PASS: HTTP 200 (GraphQL errors in body, not HTTP)
- PASS: country(ZZZ) returns null
- PASS: No GraphQL errors for null lookup

<details>
<summary>Response Data</summary>

```json
{
  "body": {
    "data": {
      "country": null
    }
  }
}
```
</details>

#### Invalid Field Name `[PASS]` (67ms)

- PASS: Returns error for invalid field
- PASS: Has error messages
- PASS: Error message references invalid field: "Cannot query field "nonExistentField" on type "Country"."

<details>
<summary>Response Data</summary>

```json
{
  "errors": [
    "Cannot query field \"nonExistentField\" on type \"Country\"."
  ]
}
```
</details>

#### Empty Query `[PASS]` (16ms)

- PASS: Empty query returns error

<details>
<summary>Response Data</summary>

```json
{
  "status": 400,
  "body": {
    "errors": [
      {
        "message": "The request did not contain a valid GraphQL request.  Batch queries and APQ request are not currently supported for this API. Please ensure that your request contains a valid query and try again.",
        "extensions": {
          "stellate": {
            "code": "INVALID_QUERY",
            "details": {}
          }
        }
      }
    ]
  }
}
```
</details>

#### Malformed GraphQL Syntax `[PASS]` (20ms)

- PASS: Malformed query returns error
- PASS: Has error messages for syntax error

<details>
<summary>Response Data</summary>

```json
{
  "errors": [
    "The request did not contain a valid GraphQL request.  Batch queries and APQ request are not currently supported for this API. Please ensure that your request contains a valid query and try again."
  ]
}
```
</details>

### 6. Security Checks

#### Introspection Check `[WARN]` (66ms)

- PASS: HTTP 200
- PASS: Introspection is ENABLED
- WARNING: Introspection is enabled - should be disabled in production

<details>
<summary>Response Data</summary>

```json
{
  "enabled": true
}
```
</details>

#### Deep Nesting Test (depth=5) `[WARN]` (87ms)

- PASS: Server responds to deep query
- WARNING: Server allows deeply nested queries - potential DoS vector

<details>
<summary>Response Data</summary>

```json
{
  "accepted": true,
  "status": 200
}
```
</details>

---

## Security Assessment

| Check | Status | Risk |
|-------|--------|------|
| Introspection | ENABLED | Medium - disable in production |
| Query Depth Limit | NOT ENFORCED | High - add depth limit |
| Rate Limiting | Not tested | Unknown |
| Authentication | Not required | Public API |

## Recommendations

1. **Introspection**: Disable `__schema` and `__type` queries in production environments
2. **Query Depth**: Implement a query depth limit (recommended max: 7) to prevent nested attacks
3. **Complexity Limit**: Add query cost/complexity analysis to prevent expensive operations
4. **Rate Limiting**: Ensure rate limiting is applied per-IP or per-token
5. **Error Messages**: Ensure error messages do not leak internal implementation details

---

*Report generated by AQE v3 GraphQL Tester*