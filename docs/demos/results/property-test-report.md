# Property-Based Testing Report: Restful Booker API

**Target**: https://restful-booker.herokuapp.com
**Date**: 2026-02-16T10:42:55.950Z
**Total Tests**: 127

## Summary

| Verdict | Count |
|---------|-------|
| PASS | 69 |
| FAIL | 7 |
| INTERESTING | 51 |

**INTERESTING** = API accepted input that should ideally be rejected or sanitized.

## Input Boundaries

Tests: 52 | PASS: 19 | FAIL: 5 | INTERESTING: 28

### Interesting Findings

- **firstname length=0**: Input `{"firstname":""}` => Status 200
- **firstname length=10000**: Input `{"firstname":"DGKfVkQokmlXhCiwmC0FQt29BfG7ZO..."}` => Status 200
- **lastname length=0**: Input `{"lastname":""}` => Status 200
- **lastname length=10000**: Input `{"lastname":"6sPI82zeqMWNoYM9953IlSWJLePnkH..."}` => Status 200
- **totalprice=-1**: Input `{"totalprice":-1}` => Status 200
- **totalprice=-999**: Input `{"totalprice":-999}` => Status 200
- **totalprice=free**: Input `{"totalprice":"free"}` => Status 200
- **totalprice=**: Input `{"totalprice":""}` => Status 200
- **depositpaid="true"**: Input `{"depositpaid":"true"}` => Status 200
- **depositpaid="false"**: Input `{"depositpaid":"false"}` => Status 200
- **depositpaid=0**: Input `{"depositpaid":0}` => Status 200
- **depositpaid=1**: Input `{"depositpaid":1}` => Status 200
- **depositpaid=""**: Input `{"depositpaid":""}` => Status 200
- **depositpaid="yes"**: Input `{"depositpaid":"yes"}` => Status 200
- **depositpaid=[]**: Input `{"depositpaid":[]}` => Status 200
- **depositpaid={}**: Input `{"depositpaid":{}}` => Status 200
- **dates: empty strings**: Input `{"checkin":"","checkout":""}` => Status 200
- **dates: garbage strings**: Input `{"checkin":"not-a-date","checkout":"also-not"}` => Status 200
- **dates: invalid month/day**: Input `{"checkin":"2025-13-45","checkout":"2025-01-99"}` => Status 200
- **dates: US date format**: Input `{"checkin":"01/15/2025","checkout":"01/16/2025"}` => Status 200
- **dates: DD-MM-YYYY**: Input `{"checkin":"15-01-2025","checkout":"16-01-2025"}` => Status 200
- **dates: natural language**: Input `{"checkin":"tomorrow","checkout":"next week"}` => Status 200
- **dates: unix timestamps**: Input `{"checkin":1706745600,"checkout":1706832000}` => Status 200
- **additionalneeds=null**: Input `{"additionalneeds":null}` => Status 200
- **additionalneeds=12345**: Input `{"additionalneeds":12345}` => Status 200
- **additionalneeds=true**: Input `{"additionalneeds":true}` => Status 200
- **additionalneeds=["wifi","pool"]**: Input `{"additionalneeds":["wifi","pool"]}` => Status 200
- **additionalneeds={"type":"breakfast"}**: Input `{"additionalneeds":{"type":"breakfast"}}` => Status 200

### All Results

| # | Description | Expected | Actual Status | Verdict |
|---|-------------|----------|---------------|--------|
| 1 | firstname length=0 | Should reject or sanitize | 200 | INTERESTING |
| 2 | firstname length=1 | Should accept (200) | 200 | PASS |
| 3 | firstname length=5 | Should accept (200) | 200 | PASS |
| 4 | firstname length=100 | Should accept (200) | 200 | PASS |
| 5 | firstname length=1000 | Should accept (200) | 200 | PASS |
| 6 | firstname length=10000 | Should reject or sanitize | 200 | INTERESTING |
| 7 | lastname length=0 | Should reject empty | 200 | INTERESTING |
| 8 | lastname length=10000 | Should reject or truncate huge | 200 | INTERESTING |
| 9 | totalprice=0 | Should accept | 200 | PASS |
| 10 | totalprice=-1 | Should reject or coerce | 200 | INTERESTING |
| 11 | totalprice=-999 | Should reject or coerce | 200 | INTERESTING |
| 12 | totalprice=0.001 | Should accept | 200 | PASS |
| 13 | totalprice=0.5 | Should accept | 200 | PASS |
| 14 | totalprice=1 | Should accept | 200 | PASS |
| 15 | totalprice=999999 | Should accept | 200 | PASS |
| 16 | totalprice=9999999999 | Should accept | 200 | PASS |
| 17 | totalprice=NaN | Should reject or coerce | 500 | FAIL |
| 18 | totalprice=Infinity | Should reject or coerce | 500 | FAIL |
| 19 | totalprice=-Infinity | Should reject or coerce | 500 | FAIL |
| 20 | totalprice=null | Should reject or coerce | 500 | FAIL |
| 21 | totalprice=free | Should reject or coerce | 200 | INTERESTING |
| 22 | totalprice= | Should reject or coerce | 200 | INTERESTING |
| 23 | depositpaid=true | Should accept | 200 | PASS |
| 24 | depositpaid=false | Should accept | 200 | PASS |
| 25 | depositpaid="true" | Should reject or coerce to boolean | 200 | INTERESTING |
| 26 | depositpaid="false" | Should reject or coerce to boolean | 200 | INTERESTING |
| 27 | depositpaid=0 | Should reject or coerce to boolean | 200 | INTERESTING |
| 28 | depositpaid=1 | Should reject or coerce to boolean | 200 | INTERESTING |
| 29 | depositpaid=null | Should reject or coerce to boolean | 500 | FAIL |
| 30 | depositpaid="" | Should reject or coerce to boolean | 200 | INTERESTING |
| 31 | depositpaid="yes" | Should reject or coerce to boolean | 200 | INTERESTING |
| 32 | depositpaid=[] | Should reject or coerce to boolean | 200 | INTERESTING |
| 33 | depositpaid={} | Should reject or coerce to boolean | 200 | INTERESTING |
| 34 | dates: valid | Should accept | 200 | PASS |
| 35 | dates: empty strings | Should reject invalid dates | 200 | INTERESTING |
| 36 | dates: epoch dates | Should accept | 200 | PASS |
| 37 | dates: year 9999 | Should accept | 200 | PASS |
| 38 | dates: garbage strings | Should reject invalid dates | 200 | INTERESTING |
| 39 | dates: invalid month/day | Should reject invalid dates | 200 | INTERESTING |
| 40 | dates: US date format | Should reject invalid dates | 200 | INTERESTING |
| 41 | dates: DD-MM-YYYY | Should reject invalid dates | 200 | INTERESTING |
| 42 | dates: natural language | Should reject invalid dates | 200 | INTERESTING |
| 43 | dates: unix timestamps | Should reject invalid dates | 200 | INTERESTING |
| 44 | dates: null dates | Should reject invalid dates | 500 | PASS |
| 45 | additionalneeds=undefined | Should accept | 200 | PASS |
| 46 | additionalneeds="" | Should accept | 200 | PASS |
| 47 | additionalneeds=null | Should reject non-string | 200 | INTERESTING |
| 48 | additionalneeds="36hFgcrxTG0f8KeJokJN6ZjZnHFNUz5n0ZX0BsPK2LjR0ghXk | Should accept | 200 | PASS |
| 49 | additionalneeds=12345 | Should reject non-string | 200 | INTERESTING |
| 50 | additionalneeds=true | Should reject non-string | 200 | INTERESTING |
| 51 | additionalneeds=["wifi","pool"] | Should reject non-string | 200 | INTERESTING |
| 52 | additionalneeds={"type":"breakfast"} | Should reject non-string | 200 | INTERESTING |

## Schema Robustness

Tests: 24 | PASS: 11 | FAIL: 0 | INTERESTING: 13

### Interesting Findings

- **extra unknown fields**: Input `{"secret_field":"hack"}` => Status 200
- **string as totalprice**: Input `{"totalprice":"one hundred"}` => Status 200
- **string as depositpaid**: Input `{"depositpaid":"maybe"}` => Status 200
- **additionalneeds=null**: Input `{"additionalneeds":null}` => Status 200
- **special string: unicode CJK**: Input `{"firstname":"你好世界"}` => Status 200
- **special string: emoji**: Input `{"firstname":"🚀🔥💥"}` => Status 200
- **special string: HTML/XSS**: Input `{"firstname":"<script>alert('xss')</script>"}` => Status 200
- **special string: SQL injection**: Input `{"firstname":"'; DROP TABLE bookings; --"}` => Status 200
- **special string: template injection**: Input `{"firstname":"${7*7}"}` => Status 200
- **special string: prototype pollution string**: Input `{"firstname":"{{constructor.constructor('return this')()}}"}` => Status 200
- **special string: null bytes**: Input `{"firstname":"\u0000\u0000\u0000"}` => Status 200
- **special string: control characters**: Input `{"firstname":"\n\r\t"}` => Status 200
- **special string: 50K char string**: Input `{"firstname":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}` => Status 200

### All Results

| # | Description | Expected | Actual Status | Verdict |
|---|-------------|----------|---------------|--------|
| 53 | extra unknown fields | Should ignore or reject | 200 | INTERESTING |
| 54 | number as firstname | Should reject wrong type | 500 | PASS |
| 55 | boolean as lastname | Should reject wrong type | 500 | PASS |
| 56 | string as totalprice | Should reject wrong type | 200 | INTERESTING |
| 57 | string as depositpaid | Should reject wrong type | 200 | INTERESTING |
| 58 | string as bookingdates | Should reject wrong type | 500 | PASS |
| 59 | null as bookingdates | Should reject wrong type | 500 | PASS |
| 60 | firstname=null | Should reject null for required field | 500 | PASS |
| 61 | lastname=null | Should reject null for required field | 500 | PASS |
| 62 | totalprice=null | Should reject null for required field | 500 | PASS |
| 63 | depositpaid=null | Should reject null for required field | 500 | PASS |
| 64 | bookingdates=null | Should reject null for required field | 500 | PASS |
| 65 | additionalneeds=null | Should reject null for required field | 200 | INTERESTING |
| 66 | nested objects in primitives | Should reject | 500 | PASS |
| 67 | arrays in primitive fields | Should reject | 500 | PASS |
| 68 | special string: unicode CJK | Should sanitize or accept safely | 200 | INTERESTING |
| 69 | special string: emoji | Should sanitize or accept safely | 200 | INTERESTING |
| 70 | special string: HTML/XSS | Should sanitize or accept safely | 200 | INTERESTING |
| 71 | special string: SQL injection | Should sanitize or accept safely | 200 | INTERESTING |
| 72 | special string: template injection | Should sanitize or accept safely | 200 | INTERESTING |
| 73 | special string: prototype pollution string | Should sanitize or accept safely | 200 | INTERESTING |
| 74 | special string: null bytes | Should sanitize or accept safely | 200 | INTERESTING |
| 75 | special string: control characters | Should sanitize or accept safely | 200 | INTERESTING |
| 76 | special string: 50K char string | Should sanitize or accept safely | 200 | INTERESTING |

## Booking ID

Tests: 14 | PASS: 10 | FAIL: 0 | INTERESTING: 4

### Interesting Findings

- **GET /booking/1.5**: Input `{"id":1.5}` => Status 200
- **GET /booking/1; DROP TABLE**: Input `{"id":"1; DROP TABLE"}` => Status 200
- **GET /booking/**: Input `{"id":""}` => Status 200
- **GET /booking/1e10**: Input `{"id":"1e10"}` => Status 200

### All Results

| # | Description | Expected | Actual Status | Verdict |
|---|-------------|----------|---------------|--------|
| 77 | GET /booking/0 | Should return 404 or 400 for invalid ID | 404 | PASS |
| 78 | GET /booking/-1 | Should return 404 or 400 for invalid ID | 404 | PASS |
| 79 | GET /booking/99999999 | Should return 404 or 400 for invalid ID | 404 | PASS |
| 80 | GET /booking/abc | Should return 404 or 400 for invalid ID | 404 | PASS |
| 81 | GET /booking/1.5 | Should return 404 or 400 for invalid ID | 200 | INTERESTING |
| 82 | GET /booking/1; DROP TABLE | Should return 404 or 400 for invalid ID | 200 | INTERESTING |
| 83 | GET /booking/ | Should return 404 or 400 for invalid ID | 200 | INTERESTING |
| 84 | GET /booking/null | Should return 404 or 400 for invalid ID | 404 | PASS |
| 85 | GET /booking/undefined | Should return 404 or 400 for invalid ID | 404 | PASS |
| 86 | GET /booking/NaN | Should return 404 or 400 for invalid ID | 404 | PASS |
| 87 | GET /booking/true | Should return 404 or 400 for invalid ID | 404 | PASS |
| 88 | GET /booking/1e10 | Should return 404 or 400 for invalid ID | 200 | INTERESTING |
| 89 | PUT valid booking with token | Should update (200) | 200 | PASS |
| 90 | DELETE same booking twice | Second delete should return 404/405 | {"firstDelete":201,"secondDele | PASS |

## Date Logic

Tests: 6 | PASS: 0 | FAIL: 0 | INTERESTING: 6

### Interesting Findings

- **checkout before checkin**: Input `{"checkin":"2025-06-15","checkout":"2025-06-10"}` => Status 200
- **same checkin and checkout**: Input `{"checkin":"2025-06-15","checkout":"2025-06-15"}` => Status 200
- **checkin in the past (year 2000)**: Input `{}` => Status 200
- **date format: DD/MM/YYYY**: Input `{"checkin":"15/06/2025","checkout":"16/06/2025"}` => Status 200
- **date format: human readable**: Input `{"checkin":"Jun 15 2025","checkout":"Jun 16 2025"}` => Status 200
- **date format: ISO week**: Input `{"checkin":"2025-W25-1","checkout":"2025-W25-2"}` => Status 200

### All Results

| # | Description | Expected | Actual Status | Verdict |
|---|-------------|----------|---------------|--------|
| 91 | checkout before checkin | Should reject (checkout < checkin) | 200 | INTERESTING |
| 92 | same checkin and checkout | Should reject zero-night stay | 200 | INTERESTING |
| 93 | checkin in the past (year 2000) | Should reject past dates | 200 | INTERESTING |
| 94 | date format: DD/MM/YYYY | Should reject non-standard format or par | 200 | INTERESTING |
| 95 | date format: human readable | Should reject non-standard format or par | 200 | INTERESTING |
| 96 | date format: ISO week | Should reject non-standard format or par | 200 | INTERESTING |

## Auth

Tests: 11 | PASS: 11 | FAIL: 0 | INTERESTING: 0

### All Results

| # | Description | Expected | Actual Status | Verdict |
|---|-------------|----------|---------------|--------|
| 97 | PUT with empty token | Should reject (403) | 403 | PASS |
| 98 | PUT with garbage token | Should reject (403) | 403 | PASS |
| 99 | PUT with very long token (10K) | Should reject (403) | 403 | PASS |
| 100 | PUT with plausible but wrong token | Should reject (403) | 403 | PASS |
| 101 | PUT with XSS in token | Should reject (403) | 403 | PASS |
| 102 | PUT with SQL injection in token | Should reject (403) | 403 | PASS |
| 103 | PUT with null token | Should reject (403) | 403 | PASS |
| 104 | Basic auth: empty creds | Should reject (403) | 403 | PASS |
| 105 | Basic auth: wrong password | Should reject (403) | 403 | PASS |
| 106 | Basic auth: SQL injection in username | Should reject (403) | 403 | PASS |
| 107 | Basic auth: correct creds via Basic auth | Should succeed (200) | 200 | PASS |

## Randomized Fuzz

Tests: 20 | PASS: 18 | FAIL: 2 | INTERESTING: 0

### All Results

| # | Description | Expected | Actual Status | Verdict |
|---|-------------|----------|---------------|--------|
| 108 | fuzz iteration 1 | May accept | 200 | PASS |
| 109 | fuzz iteration 2 | Should reject malformed input | 500 | PASS |
| 110 | fuzz iteration 3 | Should reject malformed input | 500 | PASS |
| 111 | fuzz iteration 4 | May accept | 200 | PASS |
| 112 | fuzz iteration 5 | Should reject malformed input | 500 | PASS |
| 113 | fuzz iteration 6 | Should reject malformed input | 500 | PASS |
| 114 | fuzz iteration 7 | Should reject malformed input | 500 | PASS |
| 115 | fuzz iteration 8 | Should reject malformed input | 500 | PASS |
| 116 | fuzz iteration 9 | Should reject malformed input | 500 | PASS |
| 117 | fuzz iteration 10 | Should reject malformed input | 500 | PASS |
| 118 | fuzz iteration 11 | Should reject malformed input | 500 | PASS |
| 119 | fuzz iteration 12 | Should reject malformed input | 500 | PASS |
| 120 | fuzz iteration 13 | Should reject malformed input | 500 | PASS |
| 121 | fuzz iteration 14 | Should reject malformed input | 500 | PASS |
| 122 | fuzz iteration 15 | Should reject malformed input | 500 | PASS |
| 123 | fuzz iteration 16 | May accept | 500 | FAIL |
| 124 | fuzz iteration 17 | Should reject malformed input | 500 | PASS |
| 125 | fuzz iteration 18 | Should reject malformed input | 500 | PASS |
| 126 | fuzz iteration 19 | May accept | 500 | FAIL |
| 127 | fuzz iteration 20 | Should reject malformed input | 500 | PASS |

## Key Findings and Bugs Discovered

The following 51 test cases revealed potential issues:

### Input Boundaries

1. **firstname length=0**
   - Input: `{"firstname":""}`
   - Expected: Should reject or sanitize
   - Actual: `{"status":200,"bookingid":1278}`
   - Risk: API accepted potentially invalid/dangerous input

1. **firstname length=10000**
   - Input: `{"firstname":"DGKfVkQokmlXhCiwmC0FQt29BfG7ZO..."}`
   - Expected: Should reject or sanitize
   - Actual: `{"status":200,"bookingid":1286}`
   - Risk: API accepted potentially invalid/dangerous input

1. **lastname length=0**
   - Input: `{"lastname":""}`
   - Expected: Should reject empty
   - Actual: `{"status":200,"bookingid":1289}`
   - Risk: API accepted potentially invalid/dangerous input

1. **lastname length=10000**
   - Input: `{"lastname":"6sPI82zeqMWNoYM9953IlSWJLePnkH..."}`
   - Expected: Should reject or truncate huge
   - Actual: `{"status":200,"bookingid":1290}`
   - Risk: API accepted potentially invalid/dangerous input

1. **totalprice=-1**
   - Input: `{"totalprice":-1}`
   - Expected: Should reject or coerce
   - Actual: `{"status":200,"storedPrice":-1}`
   - Risk: API accepted potentially invalid/dangerous input

1. **totalprice=-999**
   - Input: `{"totalprice":-999}`
   - Expected: Should reject or coerce
   - Actual: `{"status":200,"storedPrice":-999}`
   - Risk: API accepted potentially invalid/dangerous input

1. **totalprice=free**
   - Input: `{"totalprice":"free"}`
   - Expected: Should reject or coerce
   - Actual: `{"status":200,"storedPrice":null}`
   - Risk: API accepted potentially invalid/dangerous input

1. **totalprice=**
   - Input: `{"totalprice":""}`
   - Expected: Should reject or coerce
   - Actual: `{"status":200,"storedPrice":null}`
   - Risk: API accepted potentially invalid/dangerous input

1. **depositpaid="true"**
   - Input: `{"depositpaid":"true"}`
   - Expected: Should reject or coerce to boolean
   - Actual: `{"status":200,"stored":true}`
   - Risk: API accepted potentially invalid/dangerous input

1. **depositpaid="false"**
   - Input: `{"depositpaid":"false"}`
   - Expected: Should reject or coerce to boolean
   - Actual: `{"status":200,"stored":true}`
   - Risk: API accepted potentially invalid/dangerous input

1. **depositpaid=0**
   - Input: `{"depositpaid":0}`
   - Expected: Should reject or coerce to boolean
   - Actual: `{"status":200,"stored":false}`
   - Risk: API accepted potentially invalid/dangerous input

1. **depositpaid=1**
   - Input: `{"depositpaid":1}`
   - Expected: Should reject or coerce to boolean
   - Actual: `{"status":200,"stored":true}`
   - Risk: API accepted potentially invalid/dangerous input

1. **depositpaid=""**
   - Input: `{"depositpaid":""}`
   - Expected: Should reject or coerce to boolean
   - Actual: `{"status":200,"stored":false}`
   - Risk: API accepted potentially invalid/dangerous input

1. **depositpaid="yes"**
   - Input: `{"depositpaid":"yes"}`
   - Expected: Should reject or coerce to boolean
   - Actual: `{"status":200,"stored":true}`
   - Risk: API accepted potentially invalid/dangerous input

1. **depositpaid=[]**
   - Input: `{"depositpaid":[]}`
   - Expected: Should reject or coerce to boolean
   - Actual: `{"status":200,"stored":true}`
   - Risk: API accepted potentially invalid/dangerous input

1. **depositpaid={}**
   - Input: `{"depositpaid":{}}`
   - Expected: Should reject or coerce to boolean
   - Actual: `{"status":200,"stored":true}`
   - Risk: API accepted potentially invalid/dangerous input

1. **dates: empty strings**
   - Input: `{"checkin":"","checkout":""}`
   - Expected: Should reject invalid dates
   - Actual: `{"status":200,"storedDates":{"checkin":"0NaN-aN-aN","checkout":"0NaN-aN-aN"}}`
   - Risk: API accepted potentially invalid/dangerous input

1. **dates: garbage strings**
   - Input: `{"checkin":"not-a-date","checkout":"also-not"}`
   - Expected: Should reject invalid dates
   - Actual: `{"status":200,"storedDates":{"checkin":"0NaN-aN-aN","checkout":"0NaN-aN-aN"}}`
   - Risk: API accepted potentially invalid/dangerous input

1. **dates: invalid month/day**
   - Input: `{"checkin":"2025-13-45","checkout":"2025-01-99"}`
   - Expected: Should reject invalid dates
   - Actual: `{"status":200,"storedDates":{"checkin":"0NaN-aN-aN","checkout":"0NaN-aN-aN"}}`
   - Risk: API accepted potentially invalid/dangerous input

1. **dates: US date format**
   - Input: `{"checkin":"01/15/2025","checkout":"01/16/2025"}`
   - Expected: Should reject invalid dates
   - Actual: `{"status":200,"storedDates":{"checkin":"2025-01-15","checkout":"2025-01-16"}}`
   - Risk: API accepted potentially invalid/dangerous input

1. **dates: DD-MM-YYYY**
   - Input: `{"checkin":"15-01-2025","checkout":"16-01-2025"}`
   - Expected: Should reject invalid dates
   - Actual: `{"status":200,"storedDates":{"checkin":"0NaN-aN-aN","checkout":"0NaN-aN-aN"}}`
   - Risk: API accepted potentially invalid/dangerous input

1. **dates: natural language**
   - Input: `{"checkin":"tomorrow","checkout":"next week"}`
   - Expected: Should reject invalid dates
   - Actual: `{"status":200,"storedDates":{"checkin":"0NaN-aN-aN","checkout":"0NaN-aN-aN"}}`
   - Risk: API accepted potentially invalid/dangerous input

1. **dates: unix timestamps**
   - Input: `{"checkin":1706745600,"checkout":1706832000}`
   - Expected: Should reject invalid dates
   - Actual: `{"status":200,"storedDates":{"checkin":"1970-01-20","checkout":"1970-01-20"}}`
   - Risk: API accepted potentially invalid/dangerous input

1. **additionalneeds=null**
   - Input: `{"additionalneeds":null}`
   - Expected: Should reject non-string
   - Actual: `{"status":200}`
   - Risk: API accepted potentially invalid/dangerous input

1. **additionalneeds=12345**
   - Input: `{"additionalneeds":12345}`
   - Expected: Should reject non-string
   - Actual: `{"status":200}`
   - Risk: API accepted potentially invalid/dangerous input

1. **additionalneeds=true**
   - Input: `{"additionalneeds":true}`
   - Expected: Should reject non-string
   - Actual: `{"status":200}`
   - Risk: API accepted potentially invalid/dangerous input

1. **additionalneeds=["wifi","pool"]**
   - Input: `{"additionalneeds":["wifi","pool"]}`
   - Expected: Should reject non-string
   - Actual: `{"status":200}`
   - Risk: API accepted potentially invalid/dangerous input

1. **additionalneeds={"type":"breakfast"}**
   - Input: `{"additionalneeds":{"type":"breakfast"}}`
   - Expected: Should reject non-string
   - Actual: `{"status":200}`
   - Risk: API accepted potentially invalid/dangerous input

### Schema Robustness

1. **extra unknown fields**
   - Input: `{"secret_field":"hack"}`
   - Expected: Should ignore or reject
   - Actual: `{"status":200}`
   - Risk: API accepted potentially invalid/dangerous input

1. **string as totalprice**
   - Input: `{"totalprice":"one hundred"}`
   - Expected: Should reject wrong type
   - Actual: `{"status":200,"body":1370}`
   - Risk: API accepted potentially invalid/dangerous input

1. **string as depositpaid**
   - Input: `{"depositpaid":"maybe"}`
   - Expected: Should reject wrong type
   - Actual: `{"status":200,"body":1373}`
   - Risk: API accepted potentially invalid/dangerous input

1. **additionalneeds=null**
   - Input: `{"additionalneeds":null}`
   - Expected: Should reject null for required field
   - Actual: `{"status":200}`
   - Risk: API accepted potentially invalid/dangerous input

1. **special string: unicode CJK**
   - Input: `{"firstname":"你好世界"}`
   - Expected: Should sanitize or accept safely
   - Actual: `{"status":200,"storedFirstname":"你好世界"}`
   - Risk: API accepted potentially invalid/dangerous input

1. **special string: emoji**
   - Input: `{"firstname":"🚀🔥💥"}`
   - Expected: Should sanitize or accept safely
   - Actual: `{"status":200,"storedFirstname":"🚀🔥💥"}`
   - Risk: API accepted potentially invalid/dangerous input

1. **special string: HTML/XSS**
   - Input: `{"firstname":"<script>alert('xss')</script>"}`
   - Expected: Should sanitize or accept safely
   - Actual: `{"status":200,"storedFirstname":"<script>alert('xss')</script>"}`
   - Risk: API accepted potentially invalid/dangerous input

1. **special string: SQL injection**
   - Input: `{"firstname":"'; DROP TABLE bookings; --"}`
   - Expected: Should sanitize or accept safely
   - Actual: `{"status":200,"storedFirstname":"'; DROP TABLE bookings; --"}`
   - Risk: API accepted potentially invalid/dangerous input

1. **special string: template injection**
   - Input: `{"firstname":"${7*7}"}`
   - Expected: Should sanitize or accept safely
   - Actual: `{"status":200,"storedFirstname":"${7*7}"}`
   - Risk: API accepted potentially invalid/dangerous input

1. **special string: prototype pollution string**
   - Input: `{"firstname":"{{constructor.constructor('return this')()}}"}`
   - Expected: Should sanitize or accept safely
   - Actual: `{"status":200,"storedFirstname":"{{constructor.constructor('return this')()}}"}`
   - Risk: API accepted potentially invalid/dangerous input

1. **special string: null bytes**
   - Input: `{"firstname":"\u0000\u0000\u0000"}`
   - Expected: Should sanitize or accept safely
   - Actual: `{"status":200,"storedFirstname":"\u0000\u0000\u0000"}`
   - Risk: API accepted potentially invalid/dangerous input

1. **special string: control characters**
   - Input: `{"firstname":"\n\r\t"}`
   - Expected: Should sanitize or accept safely
   - Actual: `{"status":200,"storedFirstname":""}`
   - Risk: API accepted potentially invalid/dangerous input

1. **special string: 50K char string**
   - Input: `{"firstname":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}`
   - Expected: Should sanitize or accept safely
   - Actual: `{"status":200,"storedFirstname":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}`
   - Risk: API accepted potentially invalid/dangerous input

### Booking ID

1. **GET /booking/1.5**
   - Input: `{"id":1.5}`
   - Expected: Should return 404 or 400 for invalid ID
   - Actual: `{"status":200,"body":{"firstname":"Mark","lastname":"Ericsson","totalprice":820,"depositpaid":false,"bookingdates":{"checkin":"2016-06-26","checkout":"2025-08-21"}}}`
   - Risk: API accepted potentially invalid/dangerous input

1. **GET /booking/1; DROP TABLE**
   - Input: `{"id":"1; DROP TABLE"}`
   - Expected: Should return 404 or 400 for invalid ID
   - Actual: `{"status":200,"body":{"firstname":"Mark","lastname":"Ericsson","totalprice":820,"depositpaid":false,"bookingdates":{"checkin":"2016-06-26","checkout":"2025-08-21"}}}`
   - Risk: API accepted potentially invalid/dangerous input

1. **GET /booking/**
   - Input: `{"id":""}`
   - Expected: Should return 404 or 400 for invalid ID
   - Actual: `{"status":200,"body":[{"bookingid":664},{"bookingid":1385},{"bookingid":881},{"bookingid":1338},{"bookingid":984},{"bookingid":796},{"bookingid":594},{"bookingid":90},{"bookingid":1275},{"bookingid":6`
   - Risk: API accepted potentially invalid/dangerous input

1. **GET /booking/1e10**
   - Input: `{"id":"1e10"}`
   - Expected: Should return 404 or 400 for invalid ID
   - Actual: `{"status":200,"body":{"firstname":"Mark","lastname":"Ericsson","totalprice":820,"depositpaid":false,"bookingdates":{"checkin":"2016-06-26","checkout":"2025-08-21"}}}`
   - Risk: API accepted potentially invalid/dangerous input

### Date Logic

1. **checkout before checkin**
   - Input: `{"checkin":"2025-06-15","checkout":"2025-06-10"}`
   - Expected: Should reject (checkout < checkin)
   - Actual: `{"status":200,"stored":{"checkin":"2025-06-15","checkout":"2025-06-10"}}`
   - Risk: API accepted potentially invalid/dangerous input

1. **same checkin and checkout**
   - Input: `{"checkin":"2025-06-15","checkout":"2025-06-15"}`
   - Expected: Should reject zero-night stay
   - Actual: `{"status":200}`
   - Risk: API accepted potentially invalid/dangerous input

1. **checkin in the past (year 2000)**
   - Input: `{}`
   - Expected: Should reject past dates
   - Actual: `{"status":200}`
   - Risk: API accepted potentially invalid/dangerous input

1. **date format: DD/MM/YYYY**
   - Input: `{"checkin":"15/06/2025","checkout":"16/06/2025"}`
   - Expected: Should reject non-standard format or parse consistently
   - Actual: `{"status":200,"stored":{"checkin":"0NaN-aN-aN","checkout":"0NaN-aN-aN"}}`
   - Risk: API accepted potentially invalid/dangerous input

1. **date format: human readable**
   - Input: `{"checkin":"Jun 15 2025","checkout":"Jun 16 2025"}`
   - Expected: Should reject non-standard format or parse consistently
   - Actual: `{"status":200,"stored":{"checkin":"2025-06-15","checkout":"2025-06-16"}}`
   - Risk: API accepted potentially invalid/dangerous input

1. **date format: ISO week**
   - Input: `{"checkin":"2025-W25-1","checkout":"2025-W25-2"}`
   - Expected: Should reject non-standard format or parse consistently
   - Actual: `{"status":200,"stored":{"checkin":"0NaN-aN-aN","checkout":"0NaN-aN-aN"}}`
   - Risk: API accepted potentially invalid/dangerous input

## Methodology

This report was generated by a property-based testing script that systematically
tests the Restful Booker API with randomized and boundary inputs across 5 categories:

1. **Input Boundaries** - Varying lengths, types, and edge values for all fields
2. **Schema Robustness** - Wrong types, null values, injections, extra fields
3. **Booking ID Properties** - Invalid IDs, double-delete, type coercion
4. **Date Logic Properties** - Invalid ranges, formats, past dates
5. **Authentication Edge Cases** - Malformed tokens, injection in credentials
6. **Randomized Fuzz** - Fully random combinations of all the above

All tests used real HTTP requests against the live API.
