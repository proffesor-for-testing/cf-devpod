#!/usr/bin/env node
import fs from 'fs';
// HTTPBin API Contract Test Suite
// Tests HTTP methods, status codes, request inspection, response formats,
// dynamic data, redirects, and authentication against httpbin.org

const BASE = 'https://httpbin.org';
const results = [];
let passCount = 0;
let failCount = 0;

function assert(condition, label) {
  if (!condition) throw new Error(`Assertion failed: ${label}`);
}

async function test(name, fn) {
  const start = Date.now();
  try {
    await fn();
    const elapsed = Date.now() - start;
    results.push({ name, status: 'PASS', elapsed, error: null });
    passCount++;
    process.stdout.write(`  PASS  ${name} (${elapsed}ms)\n`);
  } catch (e) {
    const elapsed = Date.now() - start;
    results.push({ name, status: 'FAIL', elapsed, error: e.message });
    failCount++;
    process.stdout.write(`  FAIL  ${name} (${elapsed}ms) - ${e.message}\n`);
  }
}

async function run() {
  console.log('=== HTTPBin API Contract Tests ===\n');

  // ─── 1. HTTP Methods ───────────────────────────────────────────
  console.log('--- HTTP Methods ---');

  await test('GET /get - echoes args, headers, origin, url', async () => {
    const res = await fetch(`${BASE}/get?foo=bar&baz=42`);
    assert(res.status === 200, 'status 200');
    const body = await res.json();
    assert(body.args.foo === 'bar', 'arg foo');
    assert(body.args.baz === '42', 'arg baz');
    assert(typeof body.headers === 'object', 'headers present');
    assert(typeof body.origin === 'string' && body.origin.length > 0, 'origin present');
    assert(body.url.includes('/get'), 'url echoed');
  });

  await test('POST /post - JSON body echoed', async () => {
    const payload = { message: 'hello', count: 7 };
    const res = await fetch(`${BASE}/post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    assert(res.status === 200, 'status 200');
    const body = await res.json();
    const echoed = JSON.parse(body.data);
    assert(echoed.message === 'hello', 'message echoed');
    assert(echoed.count === 7, 'count echoed');
  });

  await test('PUT /put - method handling', async () => {
    const res = await fetch(`${BASE}/put`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update' }),
    });
    assert(res.status === 200, 'status 200');
    const body = await res.json();
    assert(body.url.includes('/put'), 'url correct');
    const echoed = JSON.parse(body.data);
    assert(echoed.action === 'update', 'body echoed');
  });

  await test('PATCH /patch - method handling', async () => {
    const res = await fetch(`${BASE}/patch`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field: 'patched' }),
    });
    assert(res.status === 200, 'status 200');
    const body = await res.json();
    const echoed = JSON.parse(body.data);
    assert(echoed.field === 'patched', 'body echoed');
  });

  await test('DELETE /delete - method handling', async () => {
    const res = await fetch(`${BASE}/delete`, { method: 'DELETE' });
    assert(res.status === 200, 'status 200');
    const body = await res.json();
    assert(body.url.includes('/delete'), 'url correct');
  });

  // ─── 2. Status Codes ──────────────────────────────────────────
  console.log('\n--- Status Codes ---');

  const statusCodes = [200, 201, 204, 301, 400, 401, 403, 404, 500];
  for (const code of statusCodes) {
    await test(`GET /status/${code} - returns ${code}`, async () => {
      const res = await fetch(`${BASE}/status/${code}`, { redirect: 'manual' });
      assert(res.status === code, `expected ${code}, got ${res.status}`);
    });
  }

  // ─── 3. Request Inspection ────────────────────────────────────
  console.log('\n--- Request Inspection ---');

  await test('GET /headers - custom headers echoed', async () => {
    const res = await fetch(`${BASE}/headers`, {
      headers: { 'X-Custom-Test': 'contract-validator', 'X-Aqe-Session': 'aqe-12345' },
    });
    assert(res.status === 200, 'status 200');
    const body = await res.json();
    // HTTPBin may capitalize header names differently; do case-insensitive lookup
    const hdrs = Object.fromEntries(Object.entries(body.headers).map(([k,v]) => [k.toLowerCase(), v]));
    assert(hdrs['x-custom-test'] === 'contract-validator', 'custom header echoed');
    assert(hdrs['x-aqe-session'] === 'aqe-12345', 'aqe session header echoed');
  });

  await test('GET /ip - returns origin IP', async () => {
    const res = await fetch(`${BASE}/ip`);
    assert(res.status === 200, 'status 200');
    const body = await res.json();
    assert(typeof body.origin === 'string' && body.origin.length > 0, 'origin IP present');
  });

  await test('GET /user-agent - returns user-agent', async () => {
    const res = await fetch(`${BASE}/user-agent`, {
      headers: { 'User-Agent': 'AQE-Contract-Validator/3.0' },
    });
    assert(res.status === 200, 'status 200');
    const body = await res.json();
    assert(body['user-agent'] === 'AQE-Contract-Validator/3.0', 'user-agent echoed');
  });

  // ─── 4. Response Formats ──────────────────────────────────────
  console.log('\n--- Response Formats ---');

  await test('GET /json - JSON response', async () => {
    const res = await fetch(`${BASE}/json`);
    assert(res.status === 200, 'status 200');
    const ct = res.headers.get('content-type');
    assert(ct && ct.includes('application/json'), `content-type json, got ${ct}`);
    const body = await res.json();
    assert(typeof body.slideshow === 'object', 'slideshow object present');
  });

  await test('GET /html - HTML response', async () => {
    const res = await fetch(`${BASE}/html`);
    assert(res.status === 200, 'status 200');
    const ct = res.headers.get('content-type');
    assert(ct && ct.includes('text/html'), `content-type html, got ${ct}`);
    const text = await res.text();
    assert(text.includes('<html') || text.includes('<HTML') || text.includes('<!DOCTYPE'), 'contains HTML');
  });

  await test('GET /xml - XML response', async () => {
    const res = await fetch(`${BASE}/xml`);
    assert(res.status === 200, 'status 200');
    const ct = res.headers.get('content-type');
    assert(ct && ct.includes('application/xml'), `content-type xml, got ${ct}`);
    const text = await res.text();
    assert(text.includes('<?xml') || text.includes('<slideshow'), 'contains XML');
  });

  await test('GET /encoding/utf8 - UTF-8 content', async () => {
    const res = await fetch(`${BASE}/encoding/utf8`);
    assert(res.status === 200, 'status 200');
    const text = await res.text();
    assert(text.length > 0, 'non-empty content');
    assert(text.includes('UTF-8') || text.includes('unicode') || text.includes('Unicode'), 'mentions UTF-8/unicode');
  });

  // ─── 5. Dynamic Data ─────────────────────────────────────────
  console.log('\n--- Dynamic Data ---');

  await test('GET /delay/1 - ~1s delay measured', async () => {
    const t0 = Date.now();
    const res = await fetch(`${BASE}/delay/1`);
    const elapsed = Date.now() - t0;
    assert(res.status === 200, 'status 200');
    assert(elapsed >= 900, `delay >= 900ms, got ${elapsed}ms`);
    assert(elapsed < 5000, `delay < 5000ms, got ${elapsed}ms`);
  });

  await test('GET /bytes/1024 - response length 1024', async () => {
    const res = await fetch(`${BASE}/bytes/1024`);
    assert(res.status === 200, 'status 200');
    const buf = await res.arrayBuffer();
    assert(buf.byteLength === 1024, `expected 1024 bytes, got ${buf.byteLength}`);
  });

  await test('GET /uuid - valid UUID format', async () => {
    const res = await fetch(`${BASE}/uuid`);
    assert(res.status === 200, 'status 200');
    const body = await res.json();
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    assert(uuidRe.test(body.uuid), `valid UUID, got ${body.uuid}`);
  });

  await test('GET /base64/SFRUUEJJTiBpcyBhd2Vzb21l - decoded response', async () => {
    const res = await fetch(`${BASE}/base64/SFRUUEJJTiBpcyBhd2Vzb21l`);
    assert(res.status === 200, 'status 200');
    const text = await res.text();
    assert(text.includes('HTTPBIN is awesome'), `expected decoded text, got "${text}"`);
  });

  // ─── 6. Redirects ────────────────────────────────────────────
  console.log('\n--- Redirects ---');

  await test('GET /redirect/3 (manual) - returns 302', async () => {
    const res = await fetch(`${BASE}/redirect/3`, { redirect: 'manual' });
    assert(res.status === 302, `expected 302, got ${res.status}`);
    const loc = res.headers.get('location');
    assert(loc && (loc.includes('/redirect') || loc.includes('/relative-redirect')), `location header present: ${loc}`);
  });

  await test('GET /absolute-redirect/2 - follows to 200', async () => {
    const res = await fetch(`${BASE}/absolute-redirect/2`);
    assert(res.status === 200, `expected final 200, got ${res.status}`);
  });

  await test('GET /relative-redirect/2 - follows to 200', async () => {
    const res = await fetch(`${BASE}/relative-redirect/2`);
    assert(res.status === 200, `expected final 200, got ${res.status}`);
  });

  // ─── 7. Auth ──────────────────────────────────────────────────
  console.log('\n--- Authentication ---');

  await test('GET /basic-auth/user/pass - correct credentials', async () => {
    const creds = Buffer.from('user:pass').toString('base64');
    const res = await fetch(`${BASE}/basic-auth/user/pass`, {
      headers: { Authorization: `Basic ${creds}` },
    });
    assert(res.status === 200, `expected 200, got ${res.status}`);
    const body = await res.json();
    assert(body.authenticated === true, 'authenticated');
    assert(body.user === 'user', 'correct user');
  });

  await test('GET /basic-auth/user/pass - no credentials returns 401', async () => {
    const res = await fetch(`${BASE}/basic-auth/user/pass`);
    assert(res.status === 401, `expected 401, got ${res.status}`);
  });

  await test('GET /bearer - with Bearer token', async () => {
    const res = await fetch(`${BASE}/bearer`, {
      headers: { Authorization: 'Bearer token123' },
    });
    assert(res.status === 200, `expected 200, got ${res.status}`);
    const body = await res.json();
    assert(body.authenticated === true, 'authenticated');
    assert(body.token === 'token123', 'token echoed');
  });

  // ─── Summary ──────────────────────────────────────────────────
  console.log('\n=== Summary ===');
  console.log(`Total: ${results.length}  |  Passed: ${passCount}  |  Failed: ${failCount}`);
  console.log(`Pass rate: ${((passCount / results.length) * 100).toFixed(1)}%`);
  const totalTime = results.reduce((s, r) => s + r.elapsed, 0);
  console.log(`Total time: ${(totalTime / 1000).toFixed(2)}s`);

  // ─── Generate Report ─────────────────────────────────────────
  return generateReport(results, totalTime);
}

function generateReport(results, totalTime) {
  const now = new Date().toISOString();
  const sections = {
    'HTTP Methods': [],
    'Status Codes': [],
    'Request Inspection': [],
    'Response Formats': [],
    'Dynamic Data': [],
    'Redirects': [],
    'Authentication': [],
  };

  // Categorize results
  for (const r of results) {
    if (r.name.includes('/get') || r.name.includes('/post') || r.name.includes('/put') || r.name.includes('/patch') || r.name.includes('/delete')) {
      if (r.name.includes('/status/')) sections['Status Codes'].push(r);
      else sections['HTTP Methods'].push(r);
    } else if (r.name.includes('/status/')) sections['Status Codes'].push(r);
    else if (r.name.includes('/headers') || r.name.includes('/ip') || r.name.includes('/user-agent')) sections['Request Inspection'].push(r);
    else if (r.name.includes('/json') || r.name.includes('/html') || r.name.includes('/xml') || r.name.includes('/encoding')) sections['Response Formats'].push(r);
    else if (r.name.includes('/delay') || r.name.includes('/bytes') || r.name.includes('/uuid') || r.name.includes('/base64')) sections['Dynamic Data'].push(r);
    else if (r.name.includes('redirect')) sections['Redirects'].push(r);
    else if (r.name.includes('auth') || r.name.includes('bearer') || r.name.includes('Bearer')) sections['Authentication'].push(r);
    else sections['HTTP Methods'].push(r);
  }

  let md = `# HTTPBin API Contract Test Report

**Date**: ${now}
**Target**: https://httpbin.org
**Agent**: QE Contract Validator v3 (AQE v3.6.8)
**Total Tests**: ${results.length}
**Passed**: ${passCount} | **Failed**: ${failCount}
**Pass Rate**: ${((passCount / results.length) * 100).toFixed(1)}%
**Total Execution Time**: ${(totalTime / 1000).toFixed(2)}s

---

## Results Summary

| Category | Tests | Passed | Failed |
|----------|-------|--------|--------|
`;

  for (const [section, items] of Object.entries(sections)) {
    const p = items.filter(i => i.status === 'PASS').length;
    const f = items.filter(i => i.status === 'FAIL').length;
    md += `| ${section} | ${items.length} | ${p} | ${f} |\n`;
  }

  md += `| **Total** | **${results.length}** | **${passCount}** | **${failCount}** |\n\n---\n\n`;

  for (const [section, items] of Object.entries(sections)) {
    if (items.length === 0) continue;
    md += `## ${section}\n\n`;
    md += `| Status | Test | Time (ms) | Details |\n`;
    md += `|--------|------|-----------|----------|\n`;
    for (const r of items) {
      const icon = r.status === 'PASS' ? 'PASS' : 'FAIL';
      const detail = r.error ? r.error.substring(0, 80) : '-';
      md += `| ${icon} | ${r.name} | ${r.elapsed} | ${detail} |\n`;
    }
    md += '\n';
  }

  md += `---

## Contract Validation Details

### HTTP Methods Contract
- **GET**: Server echoes query parameters in \`args\`, request headers in \`headers\`, client IP in \`origin\`, and full URL in \`url\`
- **POST/PUT/PATCH**: Server echoes JSON request body in \`data\` field, parsed JSON in \`json\` field
- **DELETE**: Server echoes URL and headers

### Status Code Contract
- Server returns exact HTTP status code matching the path parameter
- 204 returns no body; 301 returns redirect with Location header

### Request Inspection Contract
- \`/headers\`: All request headers echoed in \`headers\` object (header names capitalized)
- \`/ip\`: Returns \`origin\` field with client IP as string
- \`/user-agent\`: Returns \`user-agent\` field matching sent User-Agent header

### Response Format Contract
- \`/json\`: Returns \`application/json\` with slideshow object
- \`/html\`: Returns \`text/html\` with valid HTML document
- \`/xml\`: Returns \`application/xml\` with valid XML document
- \`/encoding/utf8\`: Returns UTF-8 encoded text with unicode characters

### Dynamic Data Contract
- \`/delay/{n}\`: Responds after n seconds (measured >= 900ms for n=1)
- \`/bytes/{n}\`: Returns exactly n random bytes
- \`/uuid\`: Returns RFC 4122 UUID in \`uuid\` field
- \`/base64/{encoded}\`: Returns decoded base64 string

### Redirect Contract
- \`/redirect/{n}\`: Chains n redirects with 302 status, Location header points to next
- \`/absolute-redirect/{n}\`: Same but with absolute URLs in Location
- \`/relative-redirect/{n}\`: Same but with relative URLs in Location

### Authentication Contract
- \`/basic-auth/{user}/{pass}\`: Returns 200 with \`{authenticated: true, user}\` on valid Basic auth; 401 otherwise
- \`/bearer\`: Returns 200 with \`{authenticated: true, token}\` on valid Bearer token; 401 otherwise

---

## Performance Analysis

| Metric | Value |
|--------|-------|
| Total execution time | ${(totalTime / 1000).toFixed(2)}s |
| Average response time | ${(totalTime / results.length).toFixed(0)}ms |
| Fastest test | ${Math.min(...results.map(r => r.elapsed))}ms |
| Slowest test | ${Math.max(...results.map(r => r.elapsed))}ms |

---

*Generated by AQE Contract Validator v3 -- ${now}*
`;

  return { md, results };
}

// Execute
run().then(({ md, results }) => {
  fs.writeFileSync('/workspaces/cf-devpod/docs/demos/results/httpbin-api-report.md', md);
  console.log('\nReport saved to /workspaces/cf-devpod/docs/demos/results/httpbin-api-report.md');

  // Output JSON for downstream processing
  const jsonOut = JSON.stringify({
    timestamp: new Date().toISOString(),
    target: 'https://httpbin.org',
    total: results.length,
    passed: passCount,
    failed: failCount,
    passRate: ((passCount / results.length) * 100).toFixed(1) + '%',
    results,
  }, null, 2);
  fs.writeFileSync('/workspaces/cf-devpod/docs/demos/results/httpbin-api-results.json', jsonOut);
  console.log('JSON results saved to /workspaces/cf-devpod/docs/demos/results/httpbin-api-results.json');

  process.exit(failCount > 0 ? 1 : 0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(2);
});
