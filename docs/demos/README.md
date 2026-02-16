# QE Fleet Test Target Sites

Curated collection of practice websites for testing the AQE fleet across UI, API, security, and exploratory testing domains.

## Reports

| File | Description |
|------|-------------|
| [ui-testing-sites.md](./ui-testing-sites.md) | Web UI and automation practice sites |
| [api-testing-sites.md](./api-testing-sites.md) | REST, GraphQL, and API practice endpoints |
| [buggy-sites.md](./buggy-sites.md) | Deliberately buggy sites for exploratory/manual testing |
| [security-testing-sites.md](./security-testing-sites.md) | Vulnerable apps for security testing practice |
| [e-commerce-sites.md](./e-commerce-sites.md) | E-commerce demo apps for end-to-end flows |
| [comprehensive-catalog.md](./comprehensive-catalog.md) | Full catalog of 100+ sites with URLs and categories |

## Quick Start for QE Fleet

```bash
# Initialize fleet
mcp__agentic-qe__fleet_init({ topology: "hierarchical", maxAgents: 15 })

# Example: run accessibility audit on a practice site
Task({ prompt: "Audit https://practicesoftwaretesting.com", subagent_type: "qe-accessibility-auditor" })

# Example: API contract testing
Task({ prompt: "Test API at https://restful-booker.herokuapp.com/apidoc", subagent_type: "qe-contract-validator" })
```

## Sources

- [Ministry of Testing - 75+ Practice Sites](https://www.ministryoftesting.com/articles/75-testing-practice-websites-to-master-software-qa-in-2024)
- [awesome-sites-to-test-on (GitHub)](https://github.com/BMayhew/awesome-sites-to-test-on)
- [Evil Tester - API Practice Sites](https://apichallenges.eviltester.com/practice-sites)
- [Expand Testing](https://practice.expandtesting.com/)
- [BugBug - Best Selenium Practice Sites](https://bugbug.io/blog/testing-frameworks/best-selenium-practice-websites/)

---
*Compiled 2026-02-16 for AQE v3 fleet testing*
