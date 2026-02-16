#!/usr/bin/env node
// Evil Tester API Challenges - Integration Test Suite
// AQE v3 Integration Tester - Real HTTP requests only

const BASE = 'https://apichallenges.eviltester.com';
const results = [];
let challengerToken = '';
let authToken = '';
let createdTodoId = null;
let passCount = 0;
let failCount = 0;

function assert(condition, msg) {
  if (!condition) throw new Error(`Assertion failed: ${msg}`);
}

async function test(name, fn) {
  const start = Date.now();
  try {
    await fn();
    const ms = Date.now() - start;
    passCount++;
    results.push({ name, status: 'PASS', ms, error: null });
    console.log(`  PASS (${ms}ms) ${name}`);
  } catch (e) {
    const ms = Date.now() - start;
    failCount++;
    results.push({ name, status: 'FAIL', ms, error: e.message });
    console.log(`  FAIL (${ms}ms) ${name}`);
    console.log(`    -> ${e.message}`);
  }
}

function headers(extra = {}) {
  return { 'X-CHALLENGER': challengerToken, ...extra };
}

// ============================================================
// 1. SESSION CREATION
// ============================================================
async function sessionTests() {
  console.log('\n--- 1. Session Creation ---');

  await test('POST /challenger - create session', async () => {
    const res = await fetch(`${BASE}/challenger`, { method: 'POST' });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    challengerToken = res.headers.get('x-challenger');
    assert(challengerToken, 'Missing X-CHALLENGER header in response');
    assert(challengerToken.length > 0, 'X-CHALLENGER token is empty');
    console.log(`    Token: ${challengerToken}`);
  });
}

// ============================================================
// 2. TODO CRUD OPERATIONS
// ============================================================
async function crudTests() {
  console.log('\n--- 2. TODO CRUD Operations ---');

  await test('GET /todos - list all todos', async () => {
    const res = await fetch(`${BASE}/todos`, { headers: headers({ 'Accept': 'application/json' }) });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const body = await res.json();
    assert(body.todos, 'Response missing "todos" array');
    assert(Array.isArray(body.todos), '"todos" is not an array');
    console.log(`    Found ${body.todos.length} existing todos`);
  });

  await test('POST /todos - create a todo', async () => {
    const payload = { title: 'QE Fleet Test', doneStatus: false, description: 'Created by AQE fleet' };
    const res = await fetch(`${BASE}/todos`, {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json', 'Accept': 'application/json' }),
      body: JSON.stringify(payload),
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    const ct = res.headers.get('content-type');
    assert(ct && ct.includes('application/json'), `Expected JSON content-type, got ${ct}`);
    const body = await res.json();
    assert(body.id, 'Created todo missing id');
    assert(body.title === 'QE Fleet Test', `Title mismatch: ${body.title}`);
    assert(body.doneStatus === false, `doneStatus mismatch: ${body.doneStatus}`);
    createdTodoId = body.id;
    console.log(`    Created todo id=${createdTodoId}`);
  });

  await test('GET /todos/:id - get created todo', async () => {
    const res = await fetch(`${BASE}/todos/${createdTodoId}`, {
      headers: headers({ 'Accept': 'application/json' }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const body = await res.json();
    assert(body.todos && body.todos.length === 1, 'Expected single todo in response');
    const todo = body.todos[0];
    assert(todo.id === createdTodoId, `ID mismatch: ${todo.id}`);
    assert(todo.title === 'QE Fleet Test', `Title mismatch: ${todo.title}`);
  });

  await test('PUT /todos/:id - update (mark done)', async () => {
    const payload = { title: 'QE Fleet Test', doneStatus: true, description: 'Updated by AQE fleet' };
    const res = await fetch(`${BASE}/todos/${createdTodoId}`, {
      method: 'PUT',
      headers: headers({ 'Content-Type': 'application/json', 'Accept': 'application/json' }),
      body: JSON.stringify(payload),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const body = await res.json();
    assert(body.doneStatus === true, `doneStatus not updated: ${body.doneStatus}`);
    assert(body.description === 'Updated by AQE fleet', `Description not updated`);
  });

  await test('DELETE /todos/:id - delete todo', async () => {
    const res = await fetch(`${BASE}/todos/${createdTodoId}`, {
      method: 'DELETE',
      headers: headers(),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await test('GET /todos/:id - verify 404 after delete', async () => {
    const res = await fetch(`${BASE}/todos/${createdTodoId}`, {
      headers: headers({ 'Accept': 'application/json' }),
    });
    assert(res.status === 404, `Expected 404, got ${res.status}`);
  });
}

// ============================================================
// 3. CONTENT NEGOTIATION
// ============================================================
async function contentNegotiationTests() {
  console.log('\n--- 3. Content Negotiation ---');

  await test('GET /todos Accept: application/json', async () => {
    const res = await fetch(`${BASE}/todos`, {
      headers: headers({ 'Accept': 'application/json' }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const ct = res.headers.get('content-type');
    assert(ct && ct.includes('application/json'), `Expected JSON, got ${ct}`);
    const body = await res.json();
    assert(body.todos, 'Missing todos array in JSON response');
  });

  await test('GET /todos Accept: application/xml', async () => {
    const res = await fetch(`${BASE}/todos`, {
      headers: headers({ 'Accept': 'application/xml' }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const ct = res.headers.get('content-type');
    assert(ct && ct.includes('application/xml'), `Expected XML, got ${ct}`);
    const body = await res.text();
    assert(body.includes('<todos>'), 'XML response missing <todos> element');
  });

  await test('POST /todos Content-Type: application/json', async () => {
    const payload = { title: 'JSON Content Test', doneStatus: false, description: 'JSON body' };
    const res = await fetch(`${BASE}/todos`, {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json', 'Accept': 'application/json' }),
      body: JSON.stringify(payload),
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    const body = await res.json();
    assert(body.title === 'JSON Content Test', `Title mismatch: ${body.title}`);
    // cleanup
    await fetch(`${BASE}/todos/${body.id}`, { method: 'DELETE', headers: headers() });
  });

  await test('POST /todos Content-Type: application/xml', async () => {
    const xml = '<todo><title>XML Content Test</title><doneStatus>false</doneStatus><description>XML body</description></todo>';
    const res = await fetch(`${BASE}/todos`, {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/xml', 'Accept': 'application/xml' }),
      body: xml,
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    const body = await res.text();
    assert(body.includes('XML Content Test'), 'XML response missing created title');
    // extract id and cleanup
    const idMatch = body.match(/<id>(\d+)<\/id>/);
    if (idMatch) {
      await fetch(`${BASE}/todos/${idMatch[1]}`, { method: 'DELETE', headers: headers() });
    }
  });
}

// ============================================================
// 4. AUTHENTICATION CHALLENGES
// ============================================================
async function authTests() {
  console.log('\n--- 4. Authentication Challenges ---');

  await test('POST /secret/token without auth - expect 401', async () => {
    const res = await fetch(`${BASE}/secret/token`, {
      method: 'POST',
      headers: headers(),
    });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await test('POST /secret/token with valid basic auth', async () => {
    const creds = Buffer.from('admin:password').toString('base64');
    const res = await fetch(`${BASE}/secret/token`, {
      method: 'POST',
      headers: headers({ 'Authorization': `Basic ${creds}` }),
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    authToken = res.headers.get('x-auth-token');
    if (!authToken) {
      // try body
      const body = await res.json();
      authToken = body['X-AUTH-TOKEN'] || body['x-auth-token'];
    }
    assert(authToken, 'Missing X-AUTH-TOKEN in response');
    console.log(`    Auth token: ${authToken}`);
  });

  await test('GET /secret/note with X-AUTH-TOKEN', async () => {
    const res = await fetch(`${BASE}/secret/note`, {
      headers: headers({ 'X-AUTH-TOKEN': authToken, 'Accept': 'application/json' }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const body = await res.json();
    assert(body.note !== undefined, 'Response missing note field');
  });

  await test('GET /secret/note without token - expect 401', async () => {
    const res = await fetch(`${BASE}/secret/note`, {
      headers: headers(),
    });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });
}

// ============================================================
// 5. VALIDATION TESTING
// ============================================================
async function validationTests() {
  console.log('\n--- 5. Validation Testing ---');

  await test('POST /todos with title > 50 chars - expect 400', async () => {
    const longTitle = 'A'.repeat(51);
    const res = await fetch(`${BASE}/todos`, {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json', 'Accept': 'application/json' }),
      body: JSON.stringify({ title: longTitle, doneStatus: false, description: 'too long title' }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    const body = await res.json();
    assert(body.errorMessages, 'Expected errorMessages in 400 response');
    console.log(`    Error: ${JSON.stringify(body.errorMessages)}`);
  });

  await test('POST /todos with invalid doneStatus type - expect 400', async () => {
    const res = await fetch(`${BASE}/todos`, {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json', 'Accept': 'application/json' }),
      body: JSON.stringify({ title: 'Bad Status', doneStatus: 'notboolean', description: 'test' }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    const body = await res.json();
    assert(body.errorMessages, 'Expected errorMessages in 400 response');
    console.log(`    Error: ${JSON.stringify(body.errorMessages)}`);
  });

  await test('POST /todos with missing title - expect 400', async () => {
    const res = await fetch(`${BASE}/todos`, {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json', 'Accept': 'application/json' }),
      body: JSON.stringify({ doneStatus: false, description: 'no title' }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    const body = await res.json();
    assert(body.errorMessages, 'Expected errorMessages in 400 response');
    console.log(`    Error: ${JSON.stringify(body.errorMessages)}`);
  });
}

// ============================================================
// 6. CHECK CHALLENGES COMPLETED
// ============================================================
async function challengeCheck() {
  console.log('\n--- 6. Challenges Completed ---');

  await test('GET /challenges - check progress', async () => {
    const res = await fetch(`${BASE}/challenges`, {
      headers: headers({ 'Accept': 'application/json' }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const body = await res.json();
    assert(body.challenges, 'Missing challenges array');
    const done = body.challenges.filter(c => c.status === true).length;
    const total = body.challenges.length;
    console.log(`    Completed: ${done}/${total} challenges`);
    // Store for report
    results.push({ name: '__challenges__', done, total, challenges: body.challenges });
  });
}

// ============================================================
// REPORT GENERATION
// ============================================================
function generateReport() {
  const testResults = results.filter(r => r.name !== '__challenges__');
  const challengeData = results.find(r => r.name === '__challenges__');
  const totalMs = testResults.reduce((s, r) => s + (r.ms || 0), 0);

  let md = `# Evil Tester API Challenges - Integration Test Report\n\n`;
  md += `**Date**: ${new Date().toISOString()}\n`;
  md += `**Base URL**: ${BASE}\n`;
  md += `**Challenger Token**: \`${challengerToken}\`\n`;
  md += `**Test Runner**: AQE v3 Integration Tester (Node.js native fetch)\n\n`;
  md += `## Summary\n\n`;
  md += `| Metric | Value |\n|--------|-------|\n`;
  md += `| Total Tests | ${testResults.length} |\n`;
  md += `| Passed | ${passCount} |\n`;
  md += `| Failed | ${failCount} |\n`;
  md += `| Pass Rate | ${((passCount / testResults.length) * 100).toFixed(1)}% |\n`;
  md += `| Total Response Time | ${totalMs}ms |\n`;
  md += `| Avg Response Time | ${(totalMs / testResults.length).toFixed(0)}ms |\n`;

  if (challengeData) {
    md += `| Challenges Completed | ${challengeData.done}/${challengeData.total} |\n`;
  }
  md += `\n`;

  // Group by section
  const sections = [
    { title: '1. Session Creation', prefix: 'POST /challenger' },
    { title: '2. TODO CRUD Operations', prefix: ['GET /todos', 'POST /todos - create', 'GET /todos/:id', 'PUT /todos', 'DELETE /todos', 'verify 404'] },
    { title: '3. Content Negotiation', prefix: ['Accept:', 'Content-Type:'] },
    { title: '4. Authentication Challenges', prefix: ['secret'] },
    { title: '5. Validation Testing', prefix: ['title > 50', 'invalid doneStatus', 'missing'] },
    { title: '6. Challenges', prefix: ['challenges'] },
  ];

  md += `## Detailed Results\n\n`;
  md += `| # | Test | Status | Time (ms) | Notes |\n`;
  md += `|---|------|--------|-----------|-------|\n`;

  testResults.forEach((r, i) => {
    const status = r.status === 'PASS' ? 'PASS' : 'FAIL';
    const notes = r.error ? r.error.substring(0, 80) : '';
    md += `| ${i + 1} | ${r.name} | ${status} | ${r.ms} | ${notes} |\n`;
  });

  md += `\n## Test Categories\n\n`;
  md += `### 1. Session Creation\n`;
  md += `- Verified POST /challenger returns 201 with X-CHALLENGER token\n`;
  md += `- Token used for all subsequent requests\n\n`;

  md += `### 2. TODO CRUD Operations\n`;
  md += `- Full lifecycle: Create -> Read -> Update -> Delete -> Verify deletion\n`;
  md += `- Validated response schemas and status codes at each step\n\n`;

  md += `### 3. Content Negotiation\n`;
  md += `- JSON request/response via Accept and Content-Type headers\n`;
  md += `- XML request/response via Accept and Content-Type headers\n`;
  md += `- Verified content-type headers in responses match requested format\n\n`;

  md += `### 4. Authentication\n`;
  md += `- POST /secret/token with Basic auth (admin/password) to obtain X-AUTH-TOKEN\n`;
  md += `- 401 response when POST /secret/token without credentials\n`;
  md += `- 401 response when accessing GET /secret/note without token\n`;
  md += `- Successful GET /secret/note with valid X-AUTH-TOKEN\n\n`;

  md += `### 5. Validation\n`;
  md += `- Title exceeding 50 character max length rejected with 400\n`;
  md += `- Invalid doneStatus type (string instead of boolean) rejected with 400\n`;
  md += `- Missing required title field rejected with 400\n`;
  md += `- Verified errorMessages present in all 400 responses\n\n`;

  if (challengeData && challengeData.challenges) {
    md += `### 6. Challenges Progress\n\n`;
    md += `Completed **${challengeData.done}** of **${challengeData.total}** challenges.\n\n`;
    const completed = challengeData.challenges.filter(c => c.status === true);
    if (completed.length > 0) {
      md += `<details>\n<summary>Completed challenges (${completed.length})</summary>\n\n`;
      completed.forEach(c => {
        md += `- **${c.name}**: ${c.description}\n`;
      });
      md += `\n</details>\n\n`;
    }
  }

  md += `## Response Time Analysis\n\n`;
  const times = testResults.map(r => r.ms).filter(Boolean).sort((a, b) => a - b);
  if (times.length > 0) {
    md += `| Metric | Value |\n|--------|-------|\n`;
    md += `| Min | ${times[0]}ms |\n`;
    md += `| Max | ${times[times.length - 1]}ms |\n`;
    md += `| Median | ${times[Math.floor(times.length / 2)]}ms |\n`;
    md += `| P95 | ${times[Math.floor(times.length * 0.95)]}ms |\n`;
  }

  md += `\n---\n*Generated by AQE v3 Integration Tester - ${new Date().toISOString()}*\n`;

  return md;
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('Evil Tester API Challenges - Integration Test Suite');
  console.log('===================================================');

  await sessionTests();
  await crudTests();
  await contentNegotiationTests();
  await authTests();
  await validationTests();
  await challengeCheck();

  console.log('\n===================================================');
  console.log(`Results: ${passCount} passed, ${failCount} failed, ${passCount + failCount} total`);

  const report = generateReport();
  const fs = await import('fs');
  fs.writeFileSync('/workspaces/cf-devpod/docs/demos/results/api-challenges-report.md', report);
  console.log('\nReport saved to /workspaces/cf-devpod/docs/demos/results/api-challenges-report.md');

  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(e => { console.error('Fatal:', e); process.exit(2); });
