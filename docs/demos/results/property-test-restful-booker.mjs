/**
 * Property-Based Testing (Fuzzing) for Restful Booker API
 * https://restful-booker.herokuapp.com
 *
 * Generates randomized inputs to discover edge cases and bugs.
 * Uses native fetch (Node 18+).
 */

const BASE = "https://restful-booker.herokuapp.com";
const results = [];
let testId = 0;

// ── Helpers ──────────────────────────────────────────────────────────

function record(category, description, input, expected, actual, verdict) {
  testId++;
  results.push({ id: testId, category, description, input, expected, actual, verdict });
}

function randomString(len) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

async function req(method, path, body, headers = {}) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json", Accept: "application/json", ...headers },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  try {
    const r = await fetch(`${BASE}${path}`, opts);
    let data;
    const text = await r.text();
    try { data = JSON.parse(text); } catch { data = text; }
    return { status: r.status, body: data };
  } catch (e) {
    return { status: "ERROR", body: e.message };
  }
}

function validBooking(overrides = {}) {
  return {
    firstname: "Jim",
    lastname: "Brown",
    totalprice: 111,
    depositpaid: true,
    bookingdates: { checkin: "2025-01-01", checkout: "2025-01-02" },
    additionalneeds: "Breakfast",
    ...overrides,
  };
}

async function getToken() {
  const r = await req("POST", "/auth", { username: "admin", password: "password123" });
  return r.body?.token || null;
}

async function createBooking(body) {
  return req("POST", "/booking", body);
}

// ── 1. Create Booking - Input Boundaries ─────────────────────────────

async function testNameBoundaries() {
  const lengths = [0, 1, 5, 100, 1000, 10000];
  for (const len of lengths) {
    const name = randomString(len);
    const r = await createBooking(validBooking({ firstname: name }));
    const shouldReject = len === 0 || len > 1000;
    const pass = r.status === 200;
    record(
      "Input Boundaries",
      `firstname length=${len}`,
      { firstname: name.substring(0, 30) + (name.length > 30 ? "..." : "") },
      shouldReject ? "Should reject or sanitize" : "Should accept (200)",
      { status: r.status, bookingid: r.body?.bookingid },
      shouldReject && pass ? "INTERESTING" : pass ? "PASS" : "FAIL"
    );
  }
  // lastname same pattern
  for (const len of [0, 10000]) {
    const name = randomString(len);
    const r = await createBooking(validBooking({ lastname: name }));
    record(
      "Input Boundaries",
      `lastname length=${len}`,
      { lastname: name.substring(0, 30) + (name.length > 30 ? "..." : "") },
      len === 0 ? "Should reject empty" : "Should reject or truncate huge",
      { status: r.status, bookingid: r.body?.bookingid },
      r.status === 200 ? "INTERESTING" : "PASS"
    );
  }
}

async function testPriceBoundaries() {
  const prices = [0, -1, -999, 0.001, 0.5, 1, 999999, 9999999999, NaN, Infinity, -Infinity, null, "free", ""];
  for (const price of prices) {
    const r = await createBooking(validBooking({ totalprice: price }));
    const isBogus = [NaN, Infinity, -Infinity, null, "free", ""].includes(price) || price < 0;
    record(
      "Input Boundaries",
      `totalprice=${String(price)}`,
      { totalprice: price },
      isBogus ? "Should reject or coerce" : "Should accept",
      { status: r.status, storedPrice: r.body?.booking?.totalprice },
      isBogus && r.status === 200 ? "INTERESTING" : r.status === 200 ? "PASS" : "FAIL"
    );
  }
}

async function testDepositPaid() {
  const vals = [true, false, "true", "false", 0, 1, null, "", "yes", [], {}];
  for (const v of vals) {
    const r = await createBooking(validBooking({ depositpaid: v }));
    const isBogus = typeof v !== "boolean";
    record(
      "Input Boundaries",
      `depositpaid=${JSON.stringify(v)}`,
      { depositpaid: v },
      isBogus ? "Should reject or coerce to boolean" : "Should accept",
      { status: r.status, stored: r.body?.booking?.depositpaid },
      isBogus && r.status === 200 ? "INTERESTING" : r.status === 200 ? "PASS" : "FAIL"
    );
  }
}

async function testDateInputs() {
  const dates = [
    { checkin: "2025-01-01", checkout: "2025-01-02", desc: "valid", bogus: false },
    { checkin: "", checkout: "", desc: "empty strings", bogus: true },
    { checkin: "1970-01-01", checkout: "1970-01-02", desc: "epoch dates", bogus: false },
    { checkin: "9999-12-30", checkout: "9999-12-31", desc: "year 9999", bogus: false },
    { checkin: "not-a-date", checkout: "also-not", desc: "garbage strings", bogus: true },
    { checkin: "2025-13-45", checkout: "2025-01-99", desc: "invalid month/day", bogus: true },
    { checkin: "01/15/2025", checkout: "01/16/2025", desc: "US date format", bogus: true },
    { checkin: "15-01-2025", checkout: "16-01-2025", desc: "DD-MM-YYYY", bogus: true },
    { checkin: "tomorrow", checkout: "next week", desc: "natural language", bogus: true },
    { checkin: 1706745600, checkout: 1706832000, desc: "unix timestamps", bogus: true },
    { checkin: null, checkout: null, desc: "null dates", bogus: true },
  ];
  for (const d of dates) {
    const r = await createBooking(validBooking({ bookingdates: { checkin: d.checkin, checkout: d.checkout } }));
    record(
      "Input Boundaries",
      `dates: ${d.desc}`,
      { checkin: d.checkin, checkout: d.checkout },
      d.bogus ? "Should reject invalid dates" : "Should accept",
      { status: r.status, storedDates: r.body?.booking?.bookingdates },
      d.bogus && r.status === 200 ? "INTERESTING" : (!d.bogus && r.status === 200) ? "PASS" : (d.bogus && r.status !== 200) ? "PASS" : "FAIL"
    );
  }
}

async function testAdditionalNeeds() {
  const vals = [undefined, "", null, randomString(5000), 12345, true, ["wifi", "pool"], { type: "breakfast" }];
  for (const v of vals) {
    const booking = validBooking();
    if (v === undefined) delete booking.additionalneeds;
    else booking.additionalneeds = v;
    const r = await createBooking(booking);
    const isBogus = v !== undefined && typeof v !== "string";
    record(
      "Input Boundaries",
      `additionalneeds=${JSON.stringify(v)?.substring(0, 50)}`,
      { additionalneeds: typeof v === "string" ? v.substring(0, 30) : v },
      isBogus ? "Should reject non-string" : "Should accept",
      { status: r.status },
      isBogus && r.status === 200 ? "INTERESTING" : r.status === 200 ? "PASS" : "FAIL"
    );
  }
}

// ── 2. Schema Robustness ─────────────────────────────────────────────

async function testSchemaRobustness() {
  // Extra unknown fields
  let r = await createBooking(validBooking({ secret_field: "hack", __proto__: { admin: true } }));
  record("Schema Robustness", "extra unknown fields", { secret_field: "hack" }, "Should ignore or reject", { status: r.status }, r.status === 200 ? "INTERESTING" : "PASS");

  // Wrong types
  const wrongTypes = [
    { firstname: 12345, desc: "number as firstname" },
    { lastname: true, desc: "boolean as lastname" },
    { totalprice: "one hundred", desc: "string as totalprice" },
    { depositpaid: "maybe", desc: "string as depositpaid" },
    { bookingdates: "2025-01-01", desc: "string as bookingdates" },
    { bookingdates: null, desc: "null as bookingdates" },
  ];
  for (const wt of wrongTypes) {
    const { desc, ...fields } = wt;
    r = await createBooking(validBooking(fields));
    record("Schema Robustness", desc, fields, "Should reject wrong type", { status: r.status, body: typeof r.body === "string" ? r.body.substring(0, 100) : r.body?.bookingid }, r.status === 200 ? "INTERESTING" : "PASS");
  }

  // Null values for every field
  const nullFields = ["firstname", "lastname", "totalprice", "depositpaid", "bookingdates", "additionalneeds"];
  for (const f of nullFields) {
    r = await createBooking(validBooking({ [f]: null }));
    record("Schema Robustness", `${f}=null`, { [f]: null }, "Should reject null for required field", { status: r.status }, r.status === 200 ? "INTERESTING" : "PASS");
  }

  // Nested objects where primitives expected
  r = await createBooking(validBooking({ firstname: { inject: true }, totalprice: { amount: 100, currency: "USD" } }));
  record("Schema Robustness", "nested objects in primitives", { firstname: { inject: true } }, "Should reject", { status: r.status, body: JSON.stringify(r.body).substring(0, 100) }, r.status === 200 ? "INTERESTING" : "PASS");

  // Arrays where primitives expected
  r = await createBooking(validBooking({ firstname: ["a", "b"], totalprice: [100] }));
  record("Schema Robustness", "arrays in primitive fields", { firstname: ["a", "b"] }, "Should reject", { status: r.status }, r.status === 200 ? "INTERESTING" : "PASS");

  // Special strings: unicode, emoji, HTML, SQL injection
  const specialStrings = [
    { val: "\u4f60\u597d\u4e16\u754c", desc: "unicode CJK" },
    { val: "\u{1F680}\u{1F525}\u{1F4A5}", desc: "emoji" },
    { val: "<script>alert('xss')</script>", desc: "HTML/XSS" },
    { val: "'; DROP TABLE bookings; --", desc: "SQL injection" },
    { val: "${7*7}", desc: "template injection" },
    { val: "{{constructor.constructor('return this')()}}", desc: "prototype pollution string" },
    { val: "\0\0\0", desc: "null bytes" },
    { val: "\n\r\t", desc: "control characters" },
    { val: "a".repeat(50000), desc: "50K char string" },
  ];
  for (const ss of specialStrings) {
    r = await createBooking(validBooking({ firstname: ss.val, additionalneeds: ss.val }));
    record("Schema Robustness", `special string: ${ss.desc}`, { firstname: ss.val.substring(0, 50) }, "Should sanitize or accept safely", { status: r.status, storedFirstname: typeof r.body?.booking?.firstname === "string" ? r.body.booking.firstname.substring(0, 50) : r.body?.booking?.firstname }, r.status === 200 ? "INTERESTING" : "PASS");
  }
}

// ── 3. Booking ID Properties ─────────────────────────────────────────

async function testBookingIdProperties() {
  const ids = [0, -1, 99999999, "abc", 1.5, "1; DROP TABLE", "", null, "undefined", "NaN", true, "1e10"];
  for (const id of ids) {
    const r = await req("GET", `/booking/${id}`);
    record("Booking ID", `GET /booking/${id}`, { id }, "Should return 404 or 400 for invalid ID", { status: r.status, body: typeof r.body === "string" ? r.body.substring(0, 80) : r.body }, r.status === 404 || r.status === 400 ? "PASS" : "INTERESTING");
  }

  // PUT with mismatched ID
  const token = await getToken();
  if (token) {
    // Create a booking first
    const cr = await createBooking(validBooking());
    if (cr.body?.bookingid) {
      const bookingId = cr.body.bookingid;
      const r = await req("PUT", `/booking/${bookingId}`, validBooking({ firstname: "Changed" }), { Cookie: `token=${token}` });
      record("Booking ID", "PUT valid booking with token", { bookingId }, "Should update (200)", { status: r.status }, r.status === 200 ? "PASS" : "FAIL");

      // DELETE same booking twice
      const d1 = await req("DELETE", `/booking/${bookingId}`, undefined, { Cookie: `token=${token}` });
      const d2 = await req("DELETE", `/booking/${bookingId}`, undefined, { Cookie: `token=${token}` });
      record("Booking ID", "DELETE same booking twice", { bookingId }, "Second delete should return 404/405", { firstDelete: d1.status, secondDelete: d2.status }, d2.status === 404 || d2.status === 405 ? "PASS" : "INTERESTING");
    }
  }
}

// ── 4. Date Logic Properties ─────────────────────────────────────────

async function testDateLogic() {
  // Checkout before checkin
  let r = await createBooking(validBooking({ bookingdates: { checkin: "2025-06-15", checkout: "2025-06-10" } }));
  record("Date Logic", "checkout before checkin", { checkin: "2025-06-15", checkout: "2025-06-10" }, "Should reject (checkout < checkin)", { status: r.status, stored: r.body?.booking?.bookingdates }, r.status === 200 ? "INTERESTING" : "PASS");

  // Same date
  r = await createBooking(validBooking({ bookingdates: { checkin: "2025-06-15", checkout: "2025-06-15" } }));
  record("Date Logic", "same checkin and checkout", { checkin: "2025-06-15", checkout: "2025-06-15" }, "Should reject zero-night stay", { status: r.status }, r.status === 200 ? "INTERESTING" : "PASS");

  // Checkin in the past
  r = await createBooking(validBooking({ bookingdates: { checkin: "2000-01-01", checkout: "2000-01-02" } }));
  record("Date Logic", "checkin in the past (year 2000)", {}, "Should reject past dates", { status: r.status }, r.status === 200 ? "INTERESTING" : "PASS");

  // Various date formats
  const formats = [
    { checkin: "15/06/2025", checkout: "16/06/2025", desc: "DD/MM/YYYY" },
    { checkin: "Jun 15 2025", checkout: "Jun 16 2025", desc: "human readable" },
    { checkin: "2025-W25-1", checkout: "2025-W25-2", desc: "ISO week" },
  ];
  for (const f of formats) {
    r = await createBooking(validBooking({ bookingdates: { checkin: f.checkin, checkout: f.checkout } }));
    record("Date Logic", `date format: ${f.desc}`, { checkin: f.checkin, checkout: f.checkout }, "Should reject non-standard format or parse consistently", { status: r.status, stored: r.body?.booking?.bookingdates }, r.status === 200 ? "INTERESTING" : "PASS");
  }
}

// ── 5. Authentication Edge Cases ─────────────────────────────────────

async function testAuthEdgeCases() {
  // Create a booking to test against
  const cr = await createBooking(validBooking());
  const bookingId = cr.body?.bookingid;
  if (!bookingId) {
    record("Auth", "setup failed", {}, "Need a booking", { status: cr.status }, "FAIL");
    return;
  }

  const tokenCases = [
    { token: "", desc: "empty token" },
    { token: "invalid", desc: "garbage token" },
    { token: "a".repeat(10000), desc: "very long token (10K)" },
    { token: "abc123def456", desc: "plausible but wrong token" },
    { token: "<script>alert(1)</script>", desc: "XSS in token" },
    { token: "' OR 1=1 --", desc: "SQL injection in token" },
    { token: null, desc: "null token" },
  ];

  for (const tc of tokenCases) {
    const headers = tc.token !== null ? { Cookie: `token=${tc.token}` } : {};
    const r = await req("PUT", `/booking/${bookingId}`, validBooking({ firstname: "Hacked" }), headers);
    record("Auth", `PUT with ${tc.desc}`, { token: tc.token?.substring?.(0, 30) || tc.token }, "Should reject (403)", { status: r.status }, r.status === 403 ? "PASS" : r.status === 200 ? "INTERESTING" : "PASS");
  }

  // Basic auth with special characters
  const basicCreds = [
    { u: "", p: "", desc: "empty creds" },
    { u: "admin", p: "wrong", desc: "wrong password" },
    { u: "admin' OR 1=1 --", p: "x", desc: "SQL injection in username" },
    { u: "admin", p: "password123", desc: "correct creds via Basic auth" },
  ];
  for (const bc of basicCreds) {
    const authHeader = "Basic " + Buffer.from(`${bc.u}:${bc.p}`).toString("base64");
    const r = await req("PUT", `/booking/${bookingId}`, validBooking({ firstname: "AuthTest" }), { Authorization: authHeader });
    const expectSuccess = bc.u === "admin" && bc.p === "password123";
    record("Auth", `Basic auth: ${bc.desc}`, { username: bc.u.substring(0, 30) }, expectSuccess ? "Should succeed (200)" : "Should reject (403)", { status: r.status }, expectSuccess ? (r.status === 200 ? "PASS" : "FAIL") : (r.status === 403 ? "PASS" : "INTERESTING"));
  }
}

// ── 6. Randomized Fuzz (fill up to 100+ tests) ──────────────────────

async function randomizedFuzz() {
  const fuzzCount = 20;
  for (let i = 0; i < fuzzCount; i++) {
    const booking = {
      firstname: pick([randomString(Math.floor(Math.random() * 200)), null, 42, "", true, undefined, { x: 1 }]),
      lastname: pick([randomString(Math.floor(Math.random() * 200)), null, 42, "", false]),
      totalprice: pick([Math.random() * 10000 - 5000, NaN, Infinity, null, "abc", 0, -1]),
      depositpaid: pick([true, false, "yes", null, 0, 1, "", undefined]),
      bookingdates: pick([
        { checkin: "2025-03-01", checkout: "2025-03-05" },
        { checkin: "", checkout: "" },
        null,
        "not-an-object",
        { checkin: randomString(10), checkout: randomString(10) },
      ]),
      additionalneeds: pick(["Breakfast", null, 123, "", undefined, randomString(500)]),
    };
    // Remove undefined keys
    Object.keys(booking).forEach(k => { if (booking[k] === undefined) delete booking[k]; });

    const r = await createBooking(booking);
    const hasBogus = booking.firstname === null || booking.firstname === undefined ||
      typeof booking.firstname !== "string" ||
      booking.bookingdates === null || typeof booking.bookingdates === "string";
    record(
      "Randomized Fuzz",
      `fuzz iteration ${i + 1}`,
      booking,
      hasBogus ? "Should reject malformed input" : "May accept",
      { status: r.status },
      hasBogus && r.status === 200 ? "INTERESTING" : r.status === 200 ? "PASS" : (!hasBogus && r.status !== 200) ? "FAIL" : "PASS"
    );
  }
}

// ── Run All ──────────────────────────────────────────────────────────

async function main() {
  console.log("Starting property-based testing against Restful Booker API...\n");

  // Verify API is up
  const ping = await req("GET", "/ping");
  if (ping.status !== 201) {
    console.error("API appears down:", ping);
    process.exit(1);
  }
  console.log("API is up (ping returned 201).\n");

  console.log("[1/6] Testing name boundaries...");
  await testNameBoundaries();
  console.log(`  ${results.length} tests so far`);

  console.log("[2/6] Testing price boundaries...");
  await testPriceBoundaries();
  console.log(`  ${results.length} tests so far`);

  console.log("[3/6] Testing depositpaid values...");
  await testDepositPaid();
  console.log(`  ${results.length} tests so far`);

  console.log("[4/6] Testing date inputs...");
  await testDateInputs();
  console.log(`  ${results.length} tests so far`);

  console.log("[5/6] Testing additional needs...");
  await testAdditionalNeeds();
  console.log(`  ${results.length} tests so far`);

  console.log("[6/6] Testing schema robustness...");
  await testSchemaRobustness();
  console.log(`  ${results.length} tests so far`);

  console.log("[7/6] Testing booking ID properties...");
  await testBookingIdProperties();
  console.log(`  ${results.length} tests so far`);

  console.log("[8/6] Testing date logic...");
  await testDateLogic();
  console.log(`  ${results.length} tests so far`);

  console.log("[9/6] Testing auth edge cases...");
  await testAuthEdgeCases();
  console.log(`  ${results.length} tests so far`);

  console.log("[10/6] Running randomized fuzz...");
  await randomizedFuzz();
  console.log(`  ${results.length} total tests\n`);

  // ── Generate Report ──
  const summary = {
    total: results.length,
    pass: results.filter(r => r.verdict === "PASS").length,
    fail: results.filter(r => r.verdict === "FAIL").length,
    interesting: results.filter(r => r.verdict === "INTERESTING").length,
  };

  console.log("=== SUMMARY ===");
  console.log(`Total: ${summary.total} | PASS: ${summary.pass} | FAIL: ${summary.fail} | INTERESTING: ${summary.interesting}`);

  // Write markdown report
  let md = `# Property-Based Testing Report: Restful Booker API\n\n`;
  md += `**Target**: ${BASE}\n`;
  md += `**Date**: ${new Date().toISOString()}\n`;
  md += `**Total Tests**: ${summary.total}\n\n`;
  md += `## Summary\n\n`;
  md += `| Verdict | Count |\n|---------|-------|\n`;
  md += `| PASS | ${summary.pass} |\n`;
  md += `| FAIL | ${summary.fail} |\n`;
  md += `| INTERESTING | ${summary.interesting} |\n\n`;
  md += `**INTERESTING** = API accepted input that should ideally be rejected or sanitized.\n\n`;

  // Group by category
  const categories = [...new Set(results.map(r => r.category))];
  for (const cat of categories) {
    const catResults = results.filter(r => r.category === cat);
    const catInteresting = catResults.filter(r => r.verdict === "INTERESTING");
    md += `## ${cat}\n\n`;
    md += `Tests: ${catResults.length} | PASS: ${catResults.filter(r => r.verdict === "PASS").length} | FAIL: ${catResults.filter(r => r.verdict === "FAIL").length} | INTERESTING: ${catInteresting.length}\n\n`;

    // Show interesting findings prominently
    if (catInteresting.length > 0) {
      md += `### Interesting Findings\n\n`;
      for (const r of catInteresting) {
        md += `- **${r.description}**: Input \`${JSON.stringify(r.input).substring(0, 120)}\` => Status ${r.actual.status ?? JSON.stringify(r.actual).substring(0, 80)}\n`;
      }
      md += `\n`;
    }

    md += `### All Results\n\n`;
    md += `| # | Description | Expected | Actual Status | Verdict |\n`;
    md += `|---|-------------|----------|---------------|--------|\n`;
    for (const r of catResults) {
      const exp = typeof r.expected === "string" ? r.expected.substring(0, 40) : JSON.stringify(r.expected).substring(0, 40);
      const act = r.actual.status ?? JSON.stringify(r.actual).substring(0, 30);
      md += `| ${r.id} | ${r.description} | ${exp} | ${act} | ${r.verdict} |\n`;
    }
    md += `\n`;
  }

  // Key findings section
  md += `## Key Findings and Bugs Discovered\n\n`;
  const interesting = results.filter(r => r.verdict === "INTERESTING");
  if (interesting.length === 0) {
    md += `No interesting findings (API handled all edge cases correctly).\n\n`;
  } else {
    md += `The following ${interesting.length} test cases revealed potential issues:\n\n`;
    const findingsByCategory = {};
    for (const r of interesting) {
      if (!findingsByCategory[r.category]) findingsByCategory[r.category] = [];
      findingsByCategory[r.category].push(r);
    }
    for (const [cat, findings] of Object.entries(findingsByCategory)) {
      md += `### ${cat}\n\n`;
      for (const f of findings) {
        md += `1. **${f.description}**\n`;
        md += `   - Input: \`${JSON.stringify(f.input).substring(0, 200)}\`\n`;
        md += `   - Expected: ${f.expected}\n`;
        md += `   - Actual: \`${JSON.stringify(f.actual).substring(0, 200)}\`\n`;
        md += `   - Risk: API accepted potentially invalid/dangerous input\n\n`;
      }
    }
  }

  md += `## Methodology\n\n`;
  md += `This report was generated by a property-based testing script that systematically\n`;
  md += `tests the Restful Booker API with randomized and boundary inputs across 5 categories:\n\n`;
  md += `1. **Input Boundaries** - Varying lengths, types, and edge values for all fields\n`;
  md += `2. **Schema Robustness** - Wrong types, null values, injections, extra fields\n`;
  md += `3. **Booking ID Properties** - Invalid IDs, double-delete, type coercion\n`;
  md += `4. **Date Logic Properties** - Invalid ranges, formats, past dates\n`;
  md += `5. **Authentication Edge Cases** - Malformed tokens, injection in credentials\n`;
  md += `6. **Randomized Fuzz** - Fully random combinations of all the above\n\n`;
  md += `All tests used real HTTP requests against the live API.\n`;

  // Write report
  const reportPath = "/workspaces/cf-devpod/docs/demos/results/property-test-report.md";
  const { writeFileSync } = await import("fs");
  writeFileSync(reportPath, md);
  console.log(`\nReport written to: ${reportPath}`);

  // Write raw JSON for further analysis
  writeFileSync("/workspaces/cf-devpod/docs/demos/results/property-test-raw.json", JSON.stringify(results, null, 2));
  console.log("Raw results written to: property-test-raw.json");
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
