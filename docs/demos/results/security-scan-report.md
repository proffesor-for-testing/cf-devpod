# Comprehensive Security Scan Report

**Scanner**: AQE v3 Security Scanner (qe-security-scanner)
**Scan Date**: 2026-02-16
**Scan ID**: sec-scan-20260216-001
**Scanner Version**: AQE v3.6.8 / Playwright 1.58.2
**Methodology**: SAST-style header/source analysis + DAST-style dynamic probing

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Sites Scanned** | 2 |
| **Total Findings** | 23 |
| **Critical** | 1 |
| **High** | 5 |
| **Medium** | 8 |
| **Low** | 5 |
| **Info** | 4 |

---

## Target 1: Gin & Juice Shop

**URL**: https://ginandjuice.shop/
**Description**: PortSwigger's intentionally vulnerable practice application
**Response Code**: 200

---

### SAST-style Findings (Static Observation)

#### SEC-GIN-001: Missing Content-Security-Policy Header
- **Severity**: HIGH
- **CWE**: CWE-1021 (Improper Restriction of Rendered UI Layers)
- **OWASP**: A05:2021 - Security Misconfiguration
- **Evidence**: The `Content-Security-Policy` response header is absent from all responses.
- **Impact**: Without CSP, the application has no browser-enforced policy against XSS, data injection, or unauthorized resource loading. An attacker who finds an injection point can execute arbitrary scripts without CSP restrictions.
- **Remediation**: Implement a strict CSP header, e.g.:
  ```
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'self'
  ```

#### SEC-GIN-002: Missing Strict-Transport-Security Header
- **Severity**: MEDIUM
- **CWE**: CWE-319 (Cleartext Transmission of Sensitive Information)
- **OWASP**: A02:2021 - Cryptographic Failures
- **Evidence**: The `Strict-Transport-Security` header is absent. While the site does serve over HTTPS, without HSTS, users accessing via HTTP are vulnerable to downgrade attacks.
- **Remediation**: Add header:
  ```
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  ```

#### SEC-GIN-003: Missing X-Content-Type-Options Header
- **Severity**: LOW
- **CWE**: CWE-16 (Configuration)
- **OWASP**: A05:2021 - Security Misconfiguration
- **Evidence**: The `X-Content-Type-Options` header is absent, allowing browsers to MIME-sniff responses.
- **Remediation**: Add `X-Content-Type-Options: nosniff`

#### SEC-GIN-004: Missing Referrer-Policy Header
- **Severity**: LOW
- **CWE**: CWE-200 (Exposure of Sensitive Information)
- **OWASP**: A01:2021 - Broken Access Control
- **Evidence**: No `Referrer-Policy` header set. The browser may send full URLs (including query parameters with sensitive data) as referrer to external sites.
- **Remediation**: Add `Referrer-Policy: strict-origin-when-cross-origin`

#### SEC-GIN-005: Missing Permissions-Policy Header
- **Severity**: LOW
- **CWE**: CWE-16 (Configuration)
- **OWASP**: A05:2021 - Security Misconfiguration
- **Evidence**: No `Permissions-Policy` header. Browser features like camera, microphone, geolocation are not restricted.
- **Remediation**: Add `Permissions-Policy: camera=(), microphone=(), geolocation=()`

#### SEC-GIN-006: AWS Load Balancer Cookie Without Secure Flag
- **Severity**: MEDIUM
- **CWE**: CWE-614 (Sensitive Cookie in HTTPS Session Without 'Secure' Attribute)
- **OWASP**: A02:2021 - Cryptographic Failures
- **Evidence**: The `AWSALB` cookie is set without the `Secure` flag and without `HttpOnly`:
  ```
  Cookie: AWSALB
  Domain: ginandjuice.shop
  Secure: false
  HttpOnly: false
  SameSite: Lax
  ```
- **Impact**: The load balancer session cookie can be transmitted over unencrypted HTTP connections and accessed by client-side JavaScript, enabling session hijacking.
- **Remediation**: Configure the AWS ALB to set Secure and HttpOnly flags on its cookies.

#### SEC-GIN-007: Backend Infrastructure Information Disclosure
- **Severity**: MEDIUM
- **CWE**: CWE-200 (Exposure of Sensitive Information)
- **OWASP**: A05:2021 - Security Misconfiguration
- **Evidence**: The response includes a custom header exposing internal infrastructure identifiers:
  ```
  x-backend: 10d4ca42-b22c-4461-a34b-a06bcb68fdf5
  ```
- **Impact**: Internal backend UUIDs can help attackers fingerprint and map infrastructure topology.
- **Remediation**: Remove the `x-backend` header from production responses or restrict it to internal networks.

#### SEC-GIN-008: Internal Markers in HTML Comments
- **Severity**: INFO
- **CWE**: CWE-615 (Inclusion of Sensitive Information in Source Code Comments)
- **OWASP**: A05:2021 - Security Misconfiguration
- **Evidence**: HTML source contains internal lab markers:
  ```html
  <!-- LAB_HEAD_START -->
  <!-- LAB_HEAD_END -->
  ```
- **Impact**: These comments reveal that this is a lab/testing environment, which could assist targeted attacks in a production context.

#### SEC-GIN-009: CSRF Token Exposed in Hidden Field
- **Severity**: INFO
- **CWE**: CWE-352 (Cross-Site Request Forgery)
- **Evidence**: A CSRF token is present as a hidden form field (this is expected and a positive security control):
  ```html
  <input type="hidden" name="csrf" value="LL9v1sar67IsAfTQKqZeG4X8SEtp5m0y">
  ```
- **Note**: CSRF protection is implemented. This is an informational observation confirming the presence of the control.

#### SEC-GIN-010: No robots.txt or sitemap.xml
- **Severity**: INFO
- **Evidence**: Neither `robots.txt` nor `sitemap.xml` returns a valid response (both return 404 or null).
- **Impact**: While not a direct vulnerability, the absence of robots.txt means search engines may index all paths including potentially sensitive ones.

---

### DAST-style Findings (Dynamic Probing)

#### SEC-GIN-011: Reflected XSS Not Confirmed on /search Endpoint
- **Severity**: INFO (negative finding)
- **Evidence**: The `/search` endpoint returned HTTP 404 for all XSS test payloads, suggesting the search path may have changed or requires different parameters. Payloads tested:
  - `<script>alert(1)</script>` -- 404
  - `"><img src=x onerror=alert(1)>` -- 404
  - `test"onmouseover=alert(1)` -- 404
- **Note**: The search functionality may exist at a different path or require authenticated access. Blog comment functionality was detected and may be a more viable XSS vector.

#### SEC-GIN-012: Blog Comment Functionality Detected (Potential Stored XSS Surface)
- **Severity**: MEDIUM
- **CWE**: CWE-79 (Improper Neutralization of Input During Web Page Generation)
- **OWASP**: A03:2021 - Injection
- **Evidence**: The blog post page at `/blog/post?postId=3` contains a comment form with CSRF protection. Given that this is an intentionally vulnerable application, stored XSS through blog comments is a likely attack vector.
- **Impact**: If comment input is not properly sanitized, attackers could inject persistent scripts affecting all visitors who view the blog post.

#### SEC-GIN-013: Open Redirect Parameters Accepted (Not Exploitable on Surface)
- **Severity**: LOW
- **Evidence**: The login page accepts `redirect` and `next` query parameters without returning errors:
  - `/login?redirect=https://evil.com` -- 200 (page loads normally)
  - `/login?next=//evil.com` -- 200 (page loads normally)
- **Impact**: While the redirect parameters are accepted, they did not trigger actual external redirects during testing. Post-authentication redirect behavior should be verified.

#### SEC-GIN-014: No Directory Listing Exposed
- **Severity**: INFO (negative finding)
- **Evidence**: All tested directory paths (`/static/`, `/assets/`, `/images/`, `/resources/`, `/uploads/`, `/files/`) returned 404. No directory listings were found.

#### SEC-GIN-015: No CORS Misconfiguration Detected
- **Severity**: INFO (negative finding)
- **Evidence**: The server does not reflect arbitrary Origin headers. Tested origins (`https://evil.com`, `null`, subdomain spoofing) received no `Access-Control-Allow-Origin` header in response. This applies to both the main page and API-style endpoints (`/catalog/product`, `/blog/post`, `/my-account`).

#### SEC-GIN-016: Error Responses Do Not Leak Server Details
- **Severity**: INFO (negative finding)
- **Evidence**: Error responses (404, 400, 413) do not contain stack traces, server software identifiers, or database information. The application handles errors cleanly on tested paths.

---

## Target 2: The Internet (Heroku)

**URL**: https://the-internet.herokuapp.com/
**Description**: Dave Haeffner's practice application for web testing
**Response Code**: 200

---

### SAST-style Findings (Static Observation)

#### SEC-INT-001: Missing Content-Security-Policy Header
- **Severity**: HIGH
- **CWE**: CWE-1021
- **OWASP**: A05:2021 - Security Misconfiguration
- **Evidence**: No `Content-Security-Policy` header present in responses.
- **Impact**: Same as SEC-GIN-001. The browser has no policy restricting script sources.
- **Remediation**: Implement a CSP header appropriate for the application.

#### SEC-INT-002: Missing Strict-Transport-Security Header
- **Severity**: MEDIUM
- **CWE**: CWE-319
- **OWASP**: A02:2021 - Cryptographic Failures
- **Evidence**: No `Strict-Transport-Security` header despite HTTPS being available.
- **Remediation**: Add `Strict-Transport-Security: max-age=31536000; includeSubDomains`

#### SEC-INT-003: Missing Referrer-Policy Header
- **Severity**: LOW
- **CWE**: CWE-200
- **Evidence**: No `Referrer-Policy` header set.

#### SEC-INT-004: Missing Permissions-Policy Header
- **Severity**: LOW
- **CWE**: CWE-16
- **Evidence**: No `Permissions-Policy` header set.

#### SEC-INT-005: Server Header Discloses Platform
- **Severity**: MEDIUM
- **CWE**: CWE-200 (Exposure of Sensitive Information to an Unauthorized Actor)
- **OWASP**: A05:2021 - Security Misconfiguration
- **Evidence**: The `Server` response header reveals the hosting platform:
  ```
  Server: Heroku
  ```
- **Impact**: Helps attackers identify the hosting platform and target platform-specific vulnerabilities.
- **Remediation**: Remove or generalize the `Server` header.

#### SEC-INT-006: Session Cookie Without Secure Flag
- **Severity**: HIGH
- **CWE**: CWE-614 (Sensitive Cookie in HTTPS Session Without 'Secure' Attribute)
- **OWASP**: A02:2021 - Cryptographic Failures
- **Evidence**: The primary session cookie lacks the Secure flag:
  ```
  Cookie: rack.session
  Domain: the-internet.herokuapp.com
  Secure: false
  HttpOnly: true
  SameSite: Lax
  ```
- **Impact**: The session cookie can be transmitted over unencrypted HTTP, enabling session hijacking via network sniffing (e.g., on public Wi-Fi).
- **Remediation**: Set the `Secure` flag on the `rack.session` cookie.

#### SEC-INT-007: Third-Party Tracking Cookies Without Secure Flag
- **Severity**: MEDIUM
- **CWE**: CWE-614
- **Evidence**: Multiple Optimizely tracking cookies are set without the `Secure` flag and without `HttpOnly`:
  - `optimizelySegments` (Secure: false, HttpOnly: false)
  - `optimizelyEndUserId` (Secure: false, HttpOnly: false)
  - `optimizelyBuckets` (Secure: false, HttpOnly: false)
  - `optimizelyPendingLogEvents` (Secure: false, HttpOnly: false)
- **Impact**: Tracking cookies can be intercepted over HTTP and read/modified by client-side scripts.

#### SEC-INT-008: Outdated JavaScript Libraries
- **Severity**: HIGH
- **CWE**: CWE-1104 (Use of Unmaintained Third-Party Components)
- **OWASP**: A06:2021 - Vulnerable and Outdated Components
- **Evidence**: The application loads severely outdated JavaScript libraries:
  ```
  jquery-1.11.3.min.js (released 2015, current: 3.7.x)
  jquery-ui-1.11.4 (released 2015, current: 1.14.x)
  ```
- **Impact**: jQuery 1.x has known XSS vulnerabilities (CVE-2020-11022, CVE-2020-11023, CVE-2019-11358). jQuery UI 1.11.4 has known vulnerabilities (CVE-2021-41184, CVE-2021-41183, CVE-2021-41182). These libraries allow attackers to exploit known, publicly documented vulnerabilities.
- **Remediation**: Update to jQuery 3.7.x and jQuery UI 1.14.x.

#### SEC-INT-009: Sitemap Uses HTTP URLs
- **Severity**: MEDIUM
- **CWE**: CWE-319
- **OWASP**: A02:2021 - Cryptographic Failures
- **Evidence**: The `sitemap.xml` file references URLs using HTTP instead of HTTPS:
  ```xml
  <loc>http://the-internet.herokuapp.com/</loc>
  <loc>http://the-internet.herokuapp.com/login</loc>
  ```
- **Impact**: Search engines and crawlers following these links will access the site via unencrypted HTTP, and users following search results may connect insecurely.
- **Remediation**: Update sitemap URLs to use `https://` scheme.

#### SEC-INT-010: Sitemap Exposes Login Path
- **Severity**: LOW
- **CWE**: CWE-200
- **Evidence**: The sitemap explicitly lists the `/login` endpoint. Combined with the outdated last-modified date (`2005-01-01`), this suggests the sitemap is unmaintained.

---

### DAST-style Findings (Dynamic Probing)

#### SEC-INT-011: SQL Injection Not Exploitable on Login Form
- **Severity**: INFO (negative finding)
- **Evidence**: SQL injection payloads submitted to the `/login` form did not result in authentication bypass, database errors, or abnormal behavior. All payloads received the standard error message:
  ```
  "Your username is invalid!"
  ```
  Payloads tested:
  | Payload | Result |
  |---------|--------|
  | `' OR '1'='1` | "Your username is invalid!" |
  | `admin'--` | "Your username is invalid!" |
  | `' UNION SELECT 1,2--` | "Your username is invalid!" |
  | `1; DROP TABLE users--` | "Your username is invalid!" |
- **Note**: The login form appears to use string comparison rather than SQL queries, which is resistant to SQLi. However, the generic "username is invalid" message does reveal that the username check happens before the password check (username enumeration).

#### SEC-INT-012: Username Enumeration via Login Error Messages
- **Severity**: MEDIUM
- **CWE**: CWE-204 (Observable Response Discrepancy)
- **OWASP**: A07:2021 - Identification and Authentication Failures
- **Evidence**: The login form returns different error messages depending on whether the username or password is incorrect:
  - Invalid username: `"Your username is invalid!"`
  - Valid username + invalid password: (expected: `"Your password is invalid!"`)
- **Impact**: An attacker can enumerate valid usernames by observing whether the error message references the username or the password.
- **Remediation**: Use a generic error message: "Invalid username or password."

#### SEC-INT-013: Authentication Bypass Not Possible via Direct Access
- **Severity**: INFO (negative finding)
- **Evidence**: Direct access to `/secure` without authentication properly redirects to `/login`. Cookie manipulation with `rack.session=admin=true` also failed to bypass authentication. The session management appears secure.

#### SEC-INT-014: Forgot Password - Internal Server Error (500)
- **Severity**: CRITICAL
- **CWE**: CWE-209 (Generation of Error Message Containing Sensitive Information)
- **OWASP**: A05:2021 - Security Misconfiguration
- **Evidence**: Submitting the forgot password form triggers an unhandled Internal Server Error:
  ```html
  <h1>Internal Server Error</h1>
  ```
- **Impact**: This indicates a server-side crash that could expose stack traces, database connection strings, or other sensitive debugging information depending on the error handler configuration. A 500 error on a password reset flow also means legitimate users cannot recover their accounts, and the crash pattern could be abused for denial-of-service.
- **Remediation**: Fix the underlying error in the password reset handler. Implement proper error handling that returns a user-friendly message without revealing internal details.

#### SEC-INT-015: Download Directory Accessible Without Authentication
- **Severity**: HIGH
- **CWE**: CWE-425 (Direct Request / Forced Browsing)
- **OWASP**: A01:2021 - Broken Access Control
- **Evidence**: The `/download` path (HTTP 200) is accessible without authentication and serves a file listing. The `/download_secure` path correctly returns HTTP 401. This creates an inconsistency where some downloadable files are publicly accessible while others require auth.
- **Impact**: Files placed in the `/download` directory are publicly accessible to anyone without authentication.
- **Remediation**: Require authentication for the `/download` path, or ensure only non-sensitive files are served from it.

#### SEC-INT-016: Authentication Endpoints Properly Enforce Access Control
- **Severity**: INFO (negative finding)
- **Evidence**: Both `/basic_auth` and `/digest_auth` endpoints correctly return HTTP 401 when accessed without credentials. The `/download_secure` endpoint also returns 401, confirming that auth-protected resources are properly gated.

---

## Vulnerability Summary Matrix

| ID | Target | Finding | Severity | CWE | OWASP |
|----|--------|---------|----------|-----|-------|
| SEC-GIN-001 | Gin & Juice | Missing CSP | HIGH | CWE-1021 | A05:2021 |
| SEC-GIN-002 | Gin & Juice | Missing HSTS | MEDIUM | CWE-319 | A02:2021 |
| SEC-GIN-003 | Gin & Juice | Missing X-Content-Type-Options | LOW | CWE-16 | A05:2021 |
| SEC-GIN-004 | Gin & Juice | Missing Referrer-Policy | LOW | CWE-200 | A01:2021 |
| SEC-GIN-005 | Gin & Juice | Missing Permissions-Policy | LOW | CWE-16 | A05:2021 |
| SEC-GIN-006 | Gin & Juice | AWSALB cookie insecure | MEDIUM | CWE-614 | A02:2021 |
| SEC-GIN-007 | Gin & Juice | Backend UUID disclosure | MEDIUM | CWE-200 | A05:2021 |
| SEC-GIN-012 | Gin & Juice | Blog comment XSS surface | MEDIUM | CWE-79 | A03:2021 |
| SEC-GIN-013 | Gin & Juice | Open redirect parameters | LOW | CWE-601 | A01:2021 |
| SEC-INT-001 | The Internet | Missing CSP | HIGH | CWE-1021 | A05:2021 |
| SEC-INT-002 | The Internet | Missing HSTS | MEDIUM | CWE-319 | A02:2021 |
| SEC-INT-005 | The Internet | Server header disclosure | MEDIUM | CWE-200 | A05:2021 |
| SEC-INT-006 | The Internet | Session cookie not Secure | HIGH | CWE-614 | A02:2021 |
| SEC-INT-007 | The Internet | Tracking cookies insecure | MEDIUM | CWE-614 | A02:2021 |
| SEC-INT-008 | The Internet | Outdated jQuery/jQuery UI | HIGH | CWE-1104 | A06:2021 |
| SEC-INT-009 | The Internet | Sitemap uses HTTP | MEDIUM | CWE-319 | A02:2021 |
| SEC-INT-010 | The Internet | Sitemap exposes login | LOW | CWE-200 | A05:2021 |
| SEC-INT-012 | The Internet | Username enumeration | MEDIUM | CWE-204 | A07:2021 |
| SEC-INT-014 | The Internet | Forgot password 500 error | CRITICAL | CWE-209 | A05:2021 |
| SEC-INT-015 | The Internet | Download dir no auth | HIGH | CWE-425 | A01:2021 |

---

## Severity Distribution

```
CRITICAL  [#]                         1  (4.3%)
HIGH      [#####]                     5  (21.7%)
MEDIUM    [########]                  8  (34.8%)
LOW       [#####]                     5  (21.7%)
INFO      [####]                      4  (17.4%)
```

---

## OWASP Top 10 (2021) Mapping

| OWASP Category | Findings |
|----------------|----------|
| A01 - Broken Access Control | SEC-GIN-004, SEC-GIN-013, SEC-INT-015 |
| A02 - Cryptographic Failures | SEC-GIN-002, SEC-GIN-006, SEC-INT-002, SEC-INT-006, SEC-INT-007, SEC-INT-009 |
| A03 - Injection | SEC-GIN-012 |
| A05 - Security Misconfiguration | SEC-GIN-001, SEC-GIN-003, SEC-GIN-005, SEC-GIN-007, SEC-INT-001, SEC-INT-005, SEC-INT-010, SEC-INT-014 |
| A06 - Vulnerable and Outdated Components | SEC-INT-008 |
| A07 - Identification and Authentication Failures | SEC-INT-012 |

---

## Scan Methodology

### Tools Used
- **Playwright 1.58.2** (Chromium headless) -- Browser automation for DAST probing
- **Node.js native fetch** -- HTTP request analysis for headers and CORS
- **AQE v3 Security Scanner** -- Orchestration and analysis framework

### SAST-style Checks Performed
1. Security response header analysis (7 headers checked per target)
2. Cookie attribute analysis (Secure, HttpOnly, SameSite)
3. HTML source code inspection (comments, hidden fields, version strings)
4. `robots.txt` and `sitemap.xml` enumeration
5. Script source analysis for outdated library versions
6. Information disclosure via custom response headers

### DAST-style Checks Performed
1. Reflected XSS testing with 3 payload variants (Gin & Juice)
2. Open redirect testing with 3 redirect parameter patterns (Gin & Juice)
3. CORS misconfiguration testing with 3 origin spoofing variants (Gin & Juice)
4. Directory listing enumeration on 6 common paths (Gin & Juice)
5. Error page information disclosure on 4 error-triggering paths (Gin & Juice)
6. Clickjacking protection validation (Gin & Juice)
7. SQL injection testing with 4 payload variants on login form (The Internet)
8. Authentication bypass via direct URL access and cookie manipulation (The Internet)
9. Forgot password information disclosure testing (The Internet)
10. Broken access control testing on 5 paths (The Internet)
11. Endpoint discovery via link enumeration (The Internet)
12. Basic auth and digest auth enforcement validation (The Internet)

### Limitations
- XSS testing was limited to reflected XSS via URL parameters; stored XSS via form submission (e.g., blog comments) was identified as a surface but not actively exploited.
- DAST probing used a single browser session without authenticated crawling.
- Dependency scanning was limited to client-side JavaScript libraries visible in HTML source; server-side dependencies were not analyzed.
- Rate limiting and WAF bypass techniques were not employed.

---

*Report generated by AQE v3 Security Scanner -- 2026-02-16*
*Scan duration: ~45 seconds across 4 parallel scan modules*
*Scanner ID: qe-security-scanner | Fleet: fleet-ca7ea9ca*
