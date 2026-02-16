/**
 * Restful Booker API Contract Test
 * Tests all major endpoints for status codes, content-type, schema, and response times.
 * Uses native fetch (Node 24).
 */

const BASE_URL = "https://restful-booker.herokuapp.com";

const results = [];
const bugs = [];

function assert(condition, message) {
  if (!condition) return message;
  return null;
}

function schemaCheck(obj, schema, path = "") {
  const errors = [];
  for (const [key, expected] of Object.entries(schema)) {
    const fullPath = path ? `${path}.${key}` : key;
    if (!(key in obj)) {
      errors.push(`Missing required field: ${fullPath}`);
      continue;
    }
    const val = obj[key];
    if (typeof expected === "string") {
      if (expected === "number|string") {
        if (typeof val !== "number" && typeof val !== "string") {
          errors.push(`${fullPath}: expected number|string, got ${typeof val}`);
        }
      } else if (typeof val !== expected) {
        errors.push(`${fullPath}: expected ${expected}, got ${typeof val} (value: ${JSON.stringify(val)})`);
      }
    } else if (typeof expected === "object" && expected !== null) {
      if (typeof val !== "object" || val === null) {
        errors.push(`${fullPath}: expected object, got ${typeof val}`);
      } else {
        errors.push(...schemaCheck(val, expected, fullPath));
      }
    }
  }
  return errors;
}

async function testEndpoint(name, method, path, { body, headers = {}, expectedStatus, expectedContentType, schema, parseAs = "json" }) {
  const url = `${BASE_URL}${path}`;
  const opts = { method, headers: { ...headers } };
  if (body) {
    opts.body = JSON.stringify(body);
    if (!opts.headers["Content-Type"]) {
      opts.headers["Content-Type"] = "application/json";
    }
  }
  if (parseAs === "json" && !opts.headers["Accept"]) {
    opts.headers["Accept"] = "application/json";
  }

  const start = performance.now();
  let res, rawBody, parsed;
  const entry = { name, method, path: url, expectedStatus, actualStatus: null, statusPass: false, contentTypePass: false, schemaPass: false, schemaErrors: [], responseTimeMs: null, errors: [], rawResponse: null };

  try {
    res = await fetch(url, opts);
    entry.responseTimeMs = Math.round(performance.now() - start);
    entry.actualStatus = res.status;
    entry.statusPass = res.status === expectedStatus;

    const ct = res.headers.get("content-type") || "";
    entry.actualContentType = ct;
    if (expectedContentType) {
      entry.contentTypePass = ct.toLowerCase().includes(expectedContentType.toLowerCase());
    } else {
      entry.contentTypePass = true; // no expectation
    }

    if (parseAs === "json") {
      rawBody = await res.text();
      entry.rawResponse = rawBody.substring(0, 500);
      try {
        parsed = JSON.parse(rawBody);
      } catch {
        entry.errors.push(`Failed to parse JSON: ${rawBody.substring(0, 200)}`);
        parsed = null;
      }
    } else {
      rawBody = await res.text();
      entry.rawResponse = rawBody.substring(0, 500);
      parsed = rawBody;
    }

    if (schema && parsed && typeof parsed === "object") {
      const schemaErrors = schemaCheck(Array.isArray(parsed) ? parsed[0] || {} : parsed, schema);
      entry.schemaErrors = schemaErrors;
      entry.schemaPass = schemaErrors.length === 0;
    } else if (!schema) {
      entry.schemaPass = true;
    }

    if (!entry.statusPass) {
      entry.errors.push(`Status: expected ${expectedStatus}, got ${res.status}`);
    }
    if (!entry.contentTypePass) {
      entry.errors.push(`Content-Type: expected to include "${expectedContentType}", got "${ct}"`);
    }
  } catch (err) {
    entry.responseTimeMs = Math.round(performance.now() - start);
    entry.errors.push(`Request failed: ${err.message}`);
  }

  results.push(entry);
  return { res, parsed, entry };
}

// ============ Run all tests ============

async function runAll() {
  console.log("=== Restful Booker API Contract Tests ===\n");

  // 1. GET /ping
  console.log("1. Testing GET /ping ...");
  await testEndpoint("Health Check", "GET", "/ping", {
    expectedStatus: 201,
    expectedContentType: "text/plain",
    parseAs: "text",
  });

  // 2. POST /auth
  console.log("2. Testing POST /auth ...");
  const { parsed: authData } = await testEndpoint("Create Auth Token", "POST", "/auth", {
    body: { username: "admin", password: "password123" },
    expectedStatus: 200,
    expectedContentType: "application/json",
    schema: { token: "string" },
  });
  const token = authData?.token;
  console.log(`   Token obtained: ${token ? "yes" : "NO"}`);

  // 2b. POST /auth with bad credentials
  console.log("2b. Testing POST /auth (bad credentials) ...");
  await testEndpoint("Auth - Bad Credentials", "POST", "/auth", {
    body: { username: "bad", password: "bad" },
    expectedStatus: 401,
    expectedContentType: "application/json",
    schema: { reason: "string" },
  });

  // 3. GET /booking
  console.log("3. Testing GET /booking ...");
  const { parsed: bookingList } = await testEndpoint("List Bookings", "GET", "/booking", {
    expectedStatus: 200,
    expectedContentType: "application/json",
    schema: { bookingid: "number" },
  });
  const existingId = bookingList?.[0]?.bookingid;

  // 4. GET /booking/:id
  if (existingId) {
    console.log(`4. Testing GET /booking/${existingId} ...`);
    await testEndpoint("Get Booking", "GET", `/booking/${existingId}`, {
      expectedStatus: 200,
      expectedContentType: "application/json",
      schema: {
        firstname: "string",
        lastname: "string",
        totalprice: "number",
        depositpaid: "boolean",
        bookingdates: {
          checkin: "string",
          checkout: "string",
        },
      },
    });
  } else {
    console.log("4. SKIP - no booking IDs available");
  }

  // 5. POST /booking - create
  console.log("5. Testing POST /booking ...");
  const sampleBooking = {
    firstname: "AQE",
    lastname: "ContractTest",
    totalprice: 250,
    depositpaid: true,
    bookingdates: {
      checkin: "2026-03-01",
      checkout: "2026-03-10",
    },
    additionalneeds: "Breakfast",
  };
  const { parsed: createData } = await testEndpoint("Create Booking", "POST", "/booking", {
    body: sampleBooking,
    expectedStatus: 200,
    expectedContentType: "application/json",
    schema: {
      bookingid: "number",
      booking: {
        firstname: "string",
        lastname: "string",
        totalprice: "number",
        depositpaid: "boolean",
        bookingdates: {
          checkin: "string",
          checkout: "string",
        },
      },
    },
  });
  const newId = createData?.bookingid;
  console.log(`   Created booking ID: ${newId ?? "NONE"}`);

  // 5b. Validate created data matches input
  if (createData?.booking) {
    const b = createData.booking;
    if (b.firstname !== sampleBooking.firstname) bugs.push({ endpoint: "POST /booking", issue: `firstname mismatch: sent "${sampleBooking.firstname}", got "${b.firstname}"` });
    if (b.lastname !== sampleBooking.lastname) bugs.push({ endpoint: "POST /booking", issue: `lastname mismatch: sent "${sampleBooking.lastname}", got "${b.lastname}"` });
    if (b.totalprice !== sampleBooking.totalprice) bugs.push({ endpoint: "POST /booking", issue: `totalprice mismatch: sent ${sampleBooking.totalprice}, got ${b.totalprice}` });
  }

  // 6. PUT /booking/:id - update
  if (newId && token) {
    console.log(`6. Testing PUT /booking/${newId} ...`);
    const updatedBooking = { ...sampleBooking, firstname: "Updated", totalprice: 999 };
    await testEndpoint("Update Booking", "PUT", `/booking/${newId}`, {
      body: updatedBooking,
      headers: { Cookie: `token=${token}` },
      expectedStatus: 200,
      expectedContentType: "application/json",
      schema: {
        firstname: "string",
        lastname: "string",
        totalprice: "number",
        depositpaid: "boolean",
        bookingdates: {
          checkin: "string",
          checkout: "string",
        },
      },
    });

    // 6b. PATCH /booking/:id - partial update
    console.log(`6b. Testing PATCH /booking/${newId} ...`);
    await testEndpoint("Partial Update Booking", "PATCH", `/booking/${newId}`, {
      body: { firstname: "Patched" },
      headers: { Cookie: `token=${token}` },
      expectedStatus: 200,
      expectedContentType: "application/json",
      schema: {
        firstname: "string",
        lastname: "string",
      },
    });

    // 7. DELETE /booking/:id
    console.log(`7. Testing DELETE /booking/${newId} ...`);
    await testEndpoint("Delete Booking", "DELETE", `/booking/${newId}`, {
      headers: { Cookie: `token=${token}` },
      expectedStatus: 201,
      expectedContentType: null,
      parseAs: "text",
    });

    // 7b. Verify deletion
    console.log(`7b. Verifying deletion of booking ${newId} ...`);
    await testEndpoint("Verify Deletion", "GET", `/booking/${newId}`, {
      expectedStatus: 404,
      expectedContentType: null,
      parseAs: "text",
    });
  } else {
    console.log("6-7. SKIP - no booking ID or token");
  }

  // === Negative / edge-case tests ===

  // 8. GET /booking/99999999 - non-existent
  console.log("8. Testing GET /booking/99999999 (non-existent) ...");
  await testEndpoint("Get Non-Existent Booking", "GET", "/booking/99999999", {
    expectedStatus: 404,
    expectedContentType: null,
    parseAs: "text",
  });

  // 9. POST /booking with missing required fields
  console.log("9. Testing POST /booking (missing fields) ...");
  await testEndpoint("Create Booking - Missing Fields", "POST", "/booking", {
    body: { firstname: "Only" },
    expectedStatus: 400,
    expectedContentType: "application/json",
  });

  // 10. PUT without auth
  if (newId || existingId) {
    const targetId = existingId || 1;
    console.log(`10. Testing PUT /booking/${targetId} (no auth) ...`);
    await testEndpoint("Update Without Auth", "PUT", `/booking/${targetId}`, {
      body: sampleBooking,
      expectedStatus: 403,
      expectedContentType: null,
      parseAs: "text",
    });
  }

  // ============ Analyze results ============
  console.log("\n=== Results Summary ===\n");

  let passed = 0, failed = 0;
  for (const r of results) {
    const allPass = r.statusPass && r.contentTypePass && r.schemaPass && r.errors.length === 0;
    if (allPass) passed++; else failed++;
    const icon = allPass ? "PASS" : "FAIL";
    console.log(`[${icon}] ${r.name} (${r.method} ${r.path}) - ${r.responseTimeMs}ms`);
    if (!allPass) {
      for (const e of [...r.errors, ...r.schemaErrors]) console.log(`       ${e}`);
    }
  }

  // Check for API bugs
  // Bug detection heuristics
  for (const r of results) {
    if (r.name === "Health Check" && r.actualStatus === 201) {
      bugs.push({ endpoint: "GET /ping", issue: "Returns 201 Created for a health check instead of 200 OK. Health checks should return 200." });
    }
    if (r.name === "Auth - Bad Credentials" && r.actualStatus === 200) {
      bugs.push({ endpoint: "POST /auth (bad creds)", issue: `Returns 200 instead of 401 for invalid credentials. Body: ${r.rawResponse}` });
    }
    if (r.name === "Delete Booking" && r.actualStatus === 201) {
      bugs.push({ endpoint: "DELETE /booking/:id", issue: "Returns 201 Created for a DELETE operation instead of 200 OK or 204 No Content." });
    }
    if (r.name === "Create Booking - Missing Fields" && r.actualStatus === 200) {
      bugs.push({ endpoint: "POST /booking (missing fields)", issue: `Returns 200 instead of 400 for incomplete booking data. Accepts invalid input. Body: ${r.rawResponse}` });
    }
    if (r.name === "Update Without Auth" && r.actualStatus !== 403) {
      bugs.push({ endpoint: "PUT /booking/:id (no auth)", issue: `Expected 403 Forbidden, got ${r.actualStatus}. Auth enforcement issue.` });
    }
    if (r.name === "Create Booking" && r.actualStatus === 200) {
      // POST should return 201 Created per REST conventions
      bugs.push({ endpoint: "POST /booking", issue: "Returns 200 OK instead of 201 Created for resource creation." });
    }
    // Check date format consistency
    if (r.name === "Get Booking" && r.schemaPass && r.rawResponse) {
      try {
        const bd = JSON.parse(r.rawResponse);
        if (bd.bookingdates?.checkin && !/^\d{4}-\d{2}-\d{2}$/.test(bd.bookingdates.checkin)) {
          bugs.push({ endpoint: "GET /booking/:id", issue: `Inconsistent date format in checkin: "${bd.bookingdates.checkin}"` });
        }
      } catch {}
    }
  }

  console.log(`\nTotal: ${results.length} tests | ${passed} passed | ${failed} failed`);
  console.log(`\nBugs / Unexpected behaviors: ${bugs.length}`);
  for (const b of bugs) {
    console.log(`  [BUG] ${b.endpoint}: ${b.issue}`);
  }

  // ============ Generate report ============
  return { results, bugs, passed, failed };
}

const { results: allResults, bugs: allBugs, passed: totalPassed, failed: totalFailed } = await runAll();

// Build markdown report
const now = new Date().toISOString();
let md = `# Restful Booker API - Contract Test Report

**Date**: ${now}
**Base URL**: ${BASE_URL}
**Tool**: AQE v3 Contract Validator (Node.js ${process.version}, native fetch)
**Total Tests**: ${allResults.length} | **Passed**: ${totalPassed} | **Failed**: ${totalFailed}

---

## Test Results

| # | Test | Method | Endpoint | Expected | Actual | Status | Content-Type | Schema | Time |
|---|------|--------|----------|----------|--------|--------|--------------|--------|------|
`;

allResults.forEach((r, i) => {
  const allPass = r.statusPass && r.contentTypePass && r.schemaPass && r.errors.length === 0;
  const statusIcon = allPass ? "PASS" : "FAIL";
  const shortPath = r.path.replace(BASE_URL, "");
  md += `| ${i + 1} | ${r.name} | ${r.method} | ${shortPath} | ${r.expectedStatus} | ${r.actualStatus ?? "ERR"} | ${r.statusPass ? "OK" : "FAIL"} | ${r.contentTypePass ? "OK" : "FAIL"} | ${r.schemaPass ? "OK" : "FAIL"} | ${r.responseTimeMs}ms |\n`;
});

md += `\n---\n\n## Detailed Results\n\n`;

for (const r of allResults) {
  const allPass = r.statusPass && r.contentTypePass && r.schemaPass && r.errors.length === 0;
  md += `### ${allPass ? "PASS" : "FAIL"}: ${r.name}\n\n`;
  md += `- **Request**: \`${r.method} ${r.path.replace(BASE_URL, "")}\`\n`;
  md += `- **Expected Status**: ${r.expectedStatus} | **Actual**: ${r.actualStatus ?? "N/A"}\n`;
  md += `- **Content-Type**: \`${r.actualContentType || "N/A"}\`\n`;
  md += `- **Response Time**: ${r.responseTimeMs}ms\n`;
  if (r.schemaErrors.length > 0) {
    md += `- **Schema Errors**:\n`;
    for (const e of r.schemaErrors) md += `  - ${e}\n`;
  }
  if (r.errors.length > 0) {
    md += `- **Errors**:\n`;
    for (const e of r.errors) md += `  - ${e}\n`;
  }
  if (r.rawResponse) {
    md += `- **Response Body** (truncated):\n\`\`\`json\n${r.rawResponse}\n\`\`\`\n`;
  }
  md += `\n`;
}

md += `---\n\n## Bugs and Unexpected Behaviors\n\n`;
if (allBugs.length === 0) {
  md += `No bugs detected.\n\n`;
} else {
  md += `| # | Endpoint | Issue |\n|---|----------|-------|\n`;
  allBugs.forEach((b, i) => {
    md += `| ${i + 1} | \`${b.endpoint}\` | ${b.issue.replace(/\|/g, "\\|").replace(/\n/g, " ")} |\n`;
  });
  md += `\n`;
}

md += `---\n\n## Contract Schema Expectations\n\n`;
md += `### POST /auth Response\n\`\`\`json\n{ "token": "string" }\n\`\`\`\n\n`;
md += `### GET /booking Response (array of)\n\`\`\`json\n{ "bookingid": "number" }\n\`\`\`\n\n`;
md += `### GET /booking/:id Response\n\`\`\`json\n{\n  "firstname": "string",\n  "lastname": "string",\n  "totalprice": "number",\n  "depositpaid": "boolean",\n  "bookingdates": {\n    "checkin": "string",\n    "checkout": "string"\n  }\n}\n\`\`\`\n\n`;
md += `### POST /booking Response\n\`\`\`json\n{\n  "bookingid": "number",\n  "booking": { /* same as GET /booking/:id */ }\n}\n\`\`\`\n\n`;

md += `---\n\n*Generated by AQE v3 Contract Validator*\n`;

// Write report
const fs = await import("fs");
const reportPath = "/workspaces/cf-devpod/docs/demos/results/restful-booker-api-report.md";
fs.writeFileSync(reportPath, md);
console.log(`\nReport saved to: ${reportPath}`);

// Output JSON summary for AQE
const summary = {
  total: allResults.length,
  passed: totalPassed,
  failed: totalFailed,
  bugs: allBugs.length,
  timestamp: now,
};
console.log(`\nJSON Summary: ${JSON.stringify(summary)}`);
