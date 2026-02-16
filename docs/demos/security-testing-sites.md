# Security Testing Practice Sites

Intentionally vulnerable applications for practicing security testing, penetration testing, and vulnerability assessment.

> **Note**: These sites are for authorized educational/practice use only. Only test against systems you have permission to test.

---

## Web Application Security

### OWASP Juice Shop
- **URL**: https://owasp.org/www-project-juice-shop/
- **Run**: `docker run -p 3000:3000 bkimminich/juice-shop`
- **What**: Modern vulnerable web app covering OWASP Top 10 and beyond. Progressive difficulty with gamified challenge tracking
- **Vulnerabilities**: XSS, SQL injection, broken auth, sensitive data exposure, security misconfigs, SSRF, and more
- **QE Use**: Comprehensive security scanning, SAST/DAST validation, vulnerability detection pipeline testing

### Gin & Juice Shop (PortSwigger)
- **URL**: https://ginandjuice.shop/
- **What**: Hosted vulnerable web app by PortSwigger (Burp Suite creators) with realistic vulnerabilities
- **QE Use**: Scanner validation, realistic vulnerability assessment

### bWAPP (Buggy Web Application)
- **URL**: http://www.itsecgames.com/
- **What**: Free, open-source app with 100+ web vulnerabilities across all OWASP Top 10 categories
- **Install**: Local VM or Docker
- **QE Use**: Systematic vulnerability coverage testing

### Google Gruyere
- **URL**: https://google-gruyere.appspot.com/
- **What**: Google's codelab for learning web application exploits and defenses
- **QE Use**: XSS, CSRF, path traversal, information disclosure testing

### Hack Yourself First (Supercar Showdown)
- **URL**: https://hack-yourself-first.com/
- **Author**: Troy Hunt
- **What**: Security testing practice site with realistic scenarios
- **QE Use**: Security assessment practice

### Firing Range
- **URL**: https://public-firing-range.appspot.com/
- **What**: Google-hosted site with multiple application security test cases
- **QE Use**: Scanner accuracy benchmarking

### Zero Bank
- **URL**: http://zero.webappsecurity.com/
- **What**: Demo banking site with intentional security flaws
- **QE Use**: Financial application security testing patterns

---

## API Security

### VAmPI (Vulnerable API)
- **URL**: https://github.com/erev0s/VAmPI
- **What**: Vulnerable REST API based on OpenAPI 3, covering OWASP API Top 10
- **Install**: Local (Python/Docker)
- **QE Use**: API security scanning, OWASP API Top 10 validation

### Damn Vulnerable GraphQL Application
- **URL**: https://github.com/dolevf/Damn-Vulnerable-GraphQL-Application
- **What**: Intentionally vulnerable GraphQL service
- **Vulnerabilities**: Injection, DoS, info disclosure, authorization bypass, batching attacks
- **QE Use**: GraphQL security testing, introspection abuse, query complexity attacks

---

## Platforms & Learning

### TryHackMe
- **URL**: https://tryhackme.com/
- **What**: Guided cybersecurity learning with hands-on labs (free tier available)
- **QE Use**: Security testing skill development

### OWASP Vulnerable Web Applications Directory
- **URL**: https://owasp.org/www-project-vulnerable-web-applications-directory/
- **What**: Comprehensive directory of vulnerable apps organized by type
- **QE Use**: Finding specialized vulnerable targets

---

## Recommended QE Fleet Security Scenarios

### SAST/DAST Validation
```
1. Scan Gin & Juice Shop - validate scanner against known vulnerabilities
2. Scan OWASP Juice Shop - comprehensive OWASP Top 10 coverage
3. Scan Zero Bank - financial application security patterns
```

### API Security Assessment
```
1. Deploy VAmPI locally - test OWASP API Top 10 detection
2. Deploy DVGA - test GraphQL-specific vulnerability detection
3. Test Restful Booker - API auth bypass and injection testing
```

### Quick Online Scan Targets
```
- https://ginandjuice.shop/ (hosted, no setup needed)
- https://google-gruyere.appspot.com/ (hosted)
- https://hack-yourself-first.com/ (hosted)
- https://public-firing-range.appspot.com/ (hosted)
```

---

## Sources
- [awesome-sites-to-test-on](https://github.com/BMayhew/awesome-sites-to-test-on)
- [OWASP Vulnerable Web Applications Directory](https://owasp.org/www-project-vulnerable-web-applications-directory/)
- [Ministry of Testing - 75+ Practice Sites](https://www.ministryoftesting.com/articles/75-testing-practice-websites-to-master-software-qa-in-2024)
