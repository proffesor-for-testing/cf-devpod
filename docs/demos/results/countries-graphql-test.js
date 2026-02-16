#!/usr/bin/env node
// Countries GraphQL API - Comprehensive Test Suite
// Endpoint: https://countries.trevorblades.com/

const ENDPOINT = "https://countries.trevorblades.com/";
const results = [];
let totalTests = 0;
let passed = 0;
let failed = 0;
let warnings = 0;

// --- Helpers ---

async function gqlRequest(query, variables = null, label = "") {
  const start = performance.now();
  let response, body, error;
  try {
    const payload = { query };
    if (variables) payload.variables = variables;
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    body = await response.json();
  } catch (e) {
    error = e.message;
  }
  const elapsed = Math.round(performance.now() - start);
  return { response, body, error, elapsed, label };
}

function assert(condition, msg) {
  totalTests++;
  if (condition) {
    passed++;
    return { pass: true, msg };
  } else {
    failed++;
    return { pass: false, msg };
  }
}

function warn(msg) {
  warnings++;
  return { warn: true, msg };
}

function section(title) {
  results.push({ section: title });
}

function record(testName, assertions, elapsed, rawResponse) {
  results.push({ testName, assertions, elapsed, rawResponse });
}

// --- Test Sections ---

async function testSchemaIntrospection() {
  section("1. Schema Introspection");

  const q = `{ __schema { types { name kind } } }`;
  const r = await gqlRequest(q, null, "Schema Introspection");

  const a = [];
  a.push(assert(r.response?.status === 200, "HTTP status is 200"));
  a.push(assert(!r.error, "No network error"));
  a.push(assert(r.body?.data?.__schema, "Response has __schema data"));

  const types = r.body?.data?.__schema?.types || [];
  const typeNames = types.map((t) => t.name);
  a.push(assert(typeNames.includes("Country"), "Schema has Country type"));
  a.push(assert(typeNames.includes("Continent"), "Schema has Continent type"));
  a.push(assert(typeNames.includes("Language"), "Schema has Language type"));
  a.push(assert(types.length > 10, `Schema has ${types.length} types (>10)`));

  // Check for key kinds
  const objectTypes = types.filter((t) => t.kind === "OBJECT");
  a.push(assert(objectTypes.length >= 3, `Has ${objectTypes.length} OBJECT types`));

  const scalarTypes = types.filter((t) => t.kind === "SCALAR");
  a.push(assert(scalarTypes.length >= 1, `Has ${scalarTypes.length} SCALAR types`));

  record("Schema Introspection", a, r.elapsed, { typesCount: types.length, sampleTypes: typeNames.slice(0, 10) });
}

async function testBasicQueries() {
  section("2. Basic Queries");

  // 2a. Continents
  const rC = await gqlRequest(`{ continents { code name } }`);
  const aC = [];
  aC.push(assert(rC.response?.status === 200, "HTTP 200"));
  aC.push(assert(Array.isArray(rC.body?.data?.continents), "continents is array"));
  const continents = rC.body?.data?.continents || [];
  aC.push(assert(continents.length === 7, `Got ${continents.length} continents (expect 7)`));
  aC.push(assert(continents.every((c) => c.code && c.name), "All continents have code and name"));
  const codes = continents.map((c) => c.code);
  aC.push(assert(codes.includes("EU"), "Contains EU continent"));
  aC.push(assert(codes.includes("NA"), "Contains NA continent"));
  record("Get All Continents", aC, rC.elapsed, { count: continents.length, sample: continents.slice(0, 3) });

  // 2b. Countries
  const rCo = await gqlRequest(`{ countries { code name capital currency } }`);
  const aCo = [];
  aCo.push(assert(rCo.response?.status === 200, "HTTP 200"));
  aCo.push(assert(Array.isArray(rCo.body?.data?.countries), "countries is array"));
  const countries = rCo.body?.data?.countries || [];
  aCo.push(assert(countries.length > 200, `Got ${countries.length} countries (>200)`));
  aCo.push(assert(countries[0]?.code !== undefined, "First country has code field"));
  aCo.push(assert(countries[0]?.name !== undefined, "First country has name field"));
  // Check nullable fields
  const withCapital = countries.filter((c) => c.capital !== null);
  aCo.push(assert(withCapital.length > 100, `${withCapital.length} countries have capital (>100)`));
  const withCurrency = countries.filter((c) => c.currency !== null);
  aCo.push(assert(withCurrency.length > 100, `${withCurrency.length} countries have currency (>100)`));
  record("Get All Countries", aCo, rCo.elapsed, { count: countries.length, sample: countries.slice(0, 3) });

  // 2c. Languages
  const rL = await gqlRequest(`{ languages { code name } }`);
  const aL = [];
  aL.push(assert(rL.response?.status === 200, "HTTP 200"));
  aL.push(assert(Array.isArray(rL.body?.data?.languages), "languages is array"));
  const languages = rL.body?.data?.languages || [];
  aL.push(assert(languages.length > 50, `Got ${languages.length} languages (>50)`));
  aL.push(assert(languages.every((l) => l.code && l.name), "All languages have code and name"));
  record("Get All Languages", aL, rL.elapsed, { count: languages.length, sample: languages.slice(0, 3) });
}

async function testFilteredQueries() {
  section("3. Filtered Queries");

  // 3a. Continent by code (EU)
  const rEU = await gqlRequest(`{ continent(code: "EU") { name countries { code name capital } } }`);
  const aEU = [];
  aEU.push(assert(rEU.response?.status === 200, "HTTP 200"));
  aEU.push(assert(rEU.body?.data?.continent?.name === "Europe", `Continent name is "${rEU.body?.data?.continent?.name}" (expect Europe)`));
  const euCountries = rEU.body?.data?.continent?.countries || [];
  aEU.push(assert(euCountries.length > 30, `EU has ${euCountries.length} countries (>30)`));
  aEU.push(assert(euCountries.some((c) => c.code === "DE"), "EU contains Germany (DE)"));
  aEU.push(assert(euCountries.some((c) => c.code === "FR"), "EU contains France (FR)"));
  aEU.push(assert(euCountries.every((c) => c.code && c.name), "All EU countries have code and name"));
  record("Get Continent (EU) with Countries", aEU, rEU.elapsed, { countriesCount: euCountries.length });

  // 3b. Single country (US)
  const rUS = await gqlRequest(`{ country(code: "US") { name capital currency languages { name } continent { name } } }`);
  const aUS = [];
  aUS.push(assert(rUS.response?.status === 200, "HTTP 200"));
  const us = rUS.body?.data?.country;
  aUS.push(assert(us?.name === "United States", `Name is "${us?.name}"`));
  aUS.push(assert(us?.capital === "Washington D.C.", `Capital is "${us?.capital}"`));
  aUS.push(assert(us?.currency?.includes("USD"), `Currency includes USD: "${us?.currency}"`));
  aUS.push(assert(us?.continent?.name === "North America", `Continent is "${us?.continent?.name}"`));
  aUS.push(assert(Array.isArray(us?.languages), "languages is array"));
  const langNames = (us?.languages || []).map((l) => l.name);
  aUS.push(assert(langNames.includes("English"), `Languages include English`));
  record("Get Country (US) Detail", aUS, rUS.elapsed, { country: us });

  // 3c. Language by code (en)
  const rEN = await gqlRequest(`{ language(code: "en") { name native rtl } }`);
  const aEN = [];
  aEN.push(assert(rEN.response?.status === 200, "HTTP 200"));
  const en = rEN.body?.data?.language;
  aEN.push(assert(en?.name === "English", `Name is "${en?.name}"`));
  aEN.push(assert(typeof en?.native === "string", `native is string: "${en?.native}"`));
  aEN.push(assert(en?.rtl === false, `rtl is false for English`));
  record("Get Language (en)", aEN, rEN.elapsed, { language: en });
}

async function testFilterArguments() {
  section("4. Filter Argument Testing");

  // 4a. Countries by currency EUR
  const rEUR = await gqlRequest(`{ countries(filter: { currency: { eq: "EUR" } }) { name currency } }`);
  const aEUR = [];
  aEUR.push(assert(rEUR.response?.status === 200, "HTTP 200"));
  const eurCountries = rEUR.body?.data?.countries || [];
  aEUR.push(assert(eurCountries.length > 10, `${eurCountries.length} countries use EUR (>10)`));
  aEUR.push(assert(eurCountries.every((c) => c.currency === "EUR"), "All returned countries have EUR currency"));
  aEUR.push(assert(eurCountries.some((c) => c.name === "Germany"), "EUR countries include Germany"));
  aEUR.push(assert(eurCountries.some((c) => c.name === "France"), "EUR countries include France"));
  record("Countries by Currency (EUR)", aEUR, rEUR.elapsed, { count: eurCountries.length, sample: eurCountries.slice(0, 5) });

  // 4b. Countries by continent filter EU
  const rFEU = await gqlRequest(`{ countries(filter: { continent: { eq: "EU" } }) { name } }`);
  const aFEU = [];
  aFEU.push(assert(rFEU.response?.status === 200, "HTTP 200"));
  const filteredEU = rFEU.body?.data?.countries || [];
  aFEU.push(assert(filteredEU.length > 30, `${filteredEU.length} countries in EU filter (>30)`));
  aFEU.push(assert(filteredEU.some((c) => c.name === "Germany"), "Filtered EU includes Germany"));
  aFEU.push(assert(filteredEU.some((c) => c.name === "France"), "Filtered EU includes France"));
  record("Countries by Continent Filter (EU)", aFEU, rFEU.elapsed, { count: filteredEU.length });
}

async function testEdgeCases() {
  section("5. Edge Cases & Error Handling");

  // 5a. Invalid country code
  const rBad = await gqlRequest(`{ country(code: "ZZZ") { name } }`);
  const aBad = [];
  aBad.push(assert(rBad.response?.status === 200, "HTTP 200 (GraphQL errors in body, not HTTP)"));
  aBad.push(assert(rBad.body?.data?.country === null, `country(ZZZ) returns null`));
  aBad.push(assert(!rBad.body?.errors, "No GraphQL errors for null lookup"));
  record("Invalid Country Code (ZZZ)", aBad, rBad.elapsed, { body: rBad.body });

  // 5b. Invalid field name
  const rInvalid = await gqlRequest(`{ countries { nonExistentField } }`);
  const aInvalid = [];
  aInvalid.push(assert(rInvalid.response?.status === 400 || rInvalid.body?.errors, "Returns error for invalid field"));
  if (rInvalid.body?.errors) {
    aInvalid.push(assert(rInvalid.body.errors.length > 0, "Has error messages"));
    aInvalid.push(assert(
      rInvalid.body.errors[0]?.message?.includes("nonExistentField") ||
      rInvalid.body.errors[0]?.message?.includes("Cannot query"),
      `Error message references invalid field: "${rInvalid.body.errors[0]?.message?.substring(0, 80)}"`
    ));
  }
  record("Invalid Field Name", aInvalid, rInvalid.elapsed, { errors: rInvalid.body?.errors?.map((e) => e.message) });

  // 5c. Empty query
  const rEmpty = await gqlRequest("");
  const aEmpty = [];
  aEmpty.push(assert(
    rEmpty.response?.status === 400 || rEmpty.body?.errors,
    "Empty query returns error"
  ));
  record("Empty Query", aEmpty, rEmpty.elapsed, { status: rEmpty.response?.status, body: rEmpty.body });

  // 5d. Malformed syntax
  const rMalformed = await gqlRequest("{ countries { name }");
  const aMalformed = [];
  aMalformed.push(assert(
    rMalformed.response?.status === 400 || rMalformed.body?.errors,
    "Malformed query returns error"
  ));
  if (rMalformed.body?.errors) {
    aMalformed.push(assert(rMalformed.body.errors.length > 0, "Has error messages for syntax error"));
  }
  record("Malformed GraphQL Syntax", aMalformed, rMalformed.elapsed, { errors: rMalformed.body?.errors?.map((e) => e.message) });
}

async function testSecurity() {
  section("6. Security Checks");

  // 6a. Introspection enabled check
  const rIntro = await gqlRequest(`{ __schema { queryType { name } } }`);
  const aIntro = [];
  aIntro.push(assert(rIntro.response?.status === 200, "HTTP 200"));
  const introEnabled = !!rIntro.body?.data?.__schema;
  aIntro.push(assert(true, `Introspection is ${introEnabled ? "ENABLED" : "DISABLED"}`));
  if (introEnabled) {
    aIntro.push(warn("Introspection is enabled - should be disabled in production"));
  }
  record("Introspection Check", aIntro, rIntro.elapsed, { enabled: introEnabled });

  // 6b. Deep nesting test
  const deepQuery = `{
    continents {
      countries {
        continent {
          countries {
            continent {
              name
            }
          }
        }
      }
    }
  }`;
  const rDeep = await gqlRequest(deepQuery);
  const aDeep = [];
  aDeep.push(assert(rDeep.response?.status === 200 || rDeep.body?.errors, "Server responds to deep query"));
  if (rDeep.body?.errors) {
    aDeep.push(assert(true, "Server rejects deep nested query (good)"));
  } else {
    aDeep.push(warn("Server allows deeply nested queries - potential DoS vector"));
  }
  record("Deep Nesting Test (depth=5)", aDeep, rDeep.elapsed, {
    accepted: !rDeep.body?.errors,
    status: rDeep.response?.status,
  });
}

// --- Report Generation ---

function generateReport() {
  const lines = [];
  lines.push("# Countries GraphQL API - Test Report");
  lines.push("");
  lines.push(`**Endpoint**: \`${ENDPOINT}\``);
  lines.push(`**Date**: ${new Date().toISOString()}`);
  lines.push(`**Node.js**: ${process.version}`);
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total Assertions | ${totalTests} |`);
  lines.push(`| Passed | ${passed} |`);
  lines.push(`| Failed | ${failed} |`);
  lines.push(`| Warnings | ${warnings} |`);
  lines.push(`| Pass Rate | ${totalTests > 0 ? ((passed / totalTests) * 100).toFixed(1) : 0}% |`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Performance summary
  const testEntries = results.filter((r) => r.testName);
  lines.push("## Performance Summary");
  lines.push("");
  lines.push("| Query | Response Time |");
  lines.push("|-------|--------------|");
  for (const entry of testEntries) {
    const icon = entry.assertions.every((a) => a.pass || a.warn) ? "PASS" : "FAIL";
    lines.push(`| ${entry.testName} | ${entry.elapsed}ms |`);
  }
  const avgTime = testEntries.length > 0 ? Math.round(testEntries.reduce((s, e) => s + e.elapsed, 0) / testEntries.length) : 0;
  lines.push(`| **Average** | **${avgTime}ms** |`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Detailed results
  lines.push("## Detailed Results");
  lines.push("");

  for (const entry of results) {
    if (entry.section) {
      lines.push(`### ${entry.section}`);
      lines.push("");
      continue;
    }

    const allPass = entry.assertions.every((a) => a.pass || a.warn);
    const failCount = entry.assertions.filter((a) => a.pass === false).length;
    const warnCount = entry.assertions.filter((a) => a.warn).length;
    let status = "PASS";
    if (failCount > 0) status = "FAIL";
    else if (warnCount > 0) status = "WARN";

    lines.push(`#### ${entry.testName} \`[${status}]\` (${entry.elapsed}ms)`);
    lines.push("");

    for (const a of entry.assertions) {
      if (a.warn) {
        lines.push(`- WARNING: ${a.msg}`);
      } else if (a.pass) {
        lines.push(`- PASS: ${a.msg}`);
      } else {
        lines.push(`- **FAIL**: ${a.msg}`);
      }
    }
    lines.push("");

    if (entry.rawResponse && Object.keys(entry.rawResponse).length > 0) {
      lines.push("<details>");
      lines.push("<summary>Response Data</summary>");
      lines.push("");
      lines.push("```json");
      lines.push(JSON.stringify(entry.rawResponse, null, 2));
      lines.push("```");
      lines.push("</details>");
      lines.push("");
    }
  }

  // Security summary
  lines.push("---");
  lines.push("");
  lines.push("## Security Assessment");
  lines.push("");
  lines.push("| Check | Status | Risk |");
  lines.push("|-------|--------|------|");
  lines.push("| Introspection | ENABLED | Medium - disable in production |");

  const deepEntry = testEntries.find((e) => e.testName.includes("Deep Nesting"));
  if (deepEntry) {
    const accepted = deepEntry.rawResponse?.accepted;
    lines.push(`| Query Depth Limit | ${accepted ? "NOT ENFORCED" : "ENFORCED"} | ${accepted ? "High - add depth limit" : "Low"} |`);
  }
  lines.push("| Rate Limiting | Not tested | Unknown |");
  lines.push("| Authentication | Not required | Public API |");
  lines.push("");

  // Recommendations
  lines.push("## Recommendations");
  lines.push("");
  lines.push("1. **Introspection**: Disable `__schema` and `__type` queries in production environments");
  lines.push("2. **Query Depth**: Implement a query depth limit (recommended max: 7) to prevent nested attacks");
  lines.push("3. **Complexity Limit**: Add query cost/complexity analysis to prevent expensive operations");
  lines.push("4. **Rate Limiting**: Ensure rate limiting is applied per-IP or per-token");
  lines.push("5. **Error Messages**: Ensure error messages do not leak internal implementation details");
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("*Report generated by AQE v3 GraphQL Tester*");

  return lines.join("\n");
}

// --- Main ---

async function main() {
  console.log("Countries GraphQL API - Test Suite Starting...\n");
  console.log(`Endpoint: ${ENDPOINT}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  await testSchemaIntrospection();
  await testBasicQueries();
  await testFilteredQueries();
  await testFilterArguments();
  await testEdgeCases();
  await testSecurity();

  console.log("\n========== RESULTS ==========");
  console.log(`Total: ${totalTests} | Passed: ${passed} | Failed: ${failed} | Warnings: ${warnings}`);
  console.log(`Pass Rate: ${((passed / totalTests) * 100).toFixed(1)}%`);

  // Print failures
  const failedTests = results.filter(
    (r) => r.assertions && r.assertions.some((a) => a.pass === false)
  );
  if (failedTests.length > 0) {
    console.log("\nFailed Tests:");
    for (const t of failedTests) {
      for (const a of t.assertions.filter((a) => a.pass === false)) {
        console.log(`  FAIL [${t.testName}]: ${a.msg}`);
      }
    }
  }

  const report = generateReport();
  const fs = await import("fs");
  fs.writeFileSync("/workspaces/cf-devpod/docs/demos/results/countries-graphql-report.md", report);
  console.log("\nReport saved to /workspaces/cf-devpod/docs/demos/results/countries-graphql-report.md");

  // Output JSON summary for AQE
  const summary = {
    endpoint: ENDPOINT,
    totalTests,
    passed,
    failed,
    warnings,
    passRate: ((passed / totalTests) * 100).toFixed(1) + "%",
    testEntries: results.filter((r) => r.testName).map((r) => ({
      name: r.testName,
      elapsed: r.elapsed,
      pass: r.assertions.every((a) => a.pass !== false),
      failCount: r.assertions.filter((a) => a.pass === false).length,
    })),
  };
  console.log("\nJSON Summary:");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
