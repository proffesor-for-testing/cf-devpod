/**
 * JSONPlaceholder API Contract Validation
 * Agentic QE v3 - Contract Testing Domain
 * Real HTTP requests against https://jsonplaceholder.typicode.com
 */

const BASE = 'https://jsonplaceholder.typicode.com';
const results = [];
let passCount = 0;
let failCount = 0;
let warnCount = 0;

// --- Helpers ---

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

function validateSchema(obj, schema, label) {
  const errors = [];
  for (const [key, type] of Object.entries(schema)) {
    if (!(key in obj)) {
      errors.push(`Missing field "${key}" in ${label}`);
    } else if (type === 'object') {
      if (typeof obj[key] !== 'object' || obj[key] === null) {
        errors.push(`Field "${key}" should be object in ${label}, got ${typeof obj[key]}`);
      }
    } else if (type === 'boolean') {
      if (typeof obj[key] !== 'boolean') {
        errors.push(`Field "${key}" should be boolean in ${label}, got ${typeof obj[key]}`);
      }
    } else if (type === 'number') {
      if (typeof obj[key] !== 'number') {
        errors.push(`Field "${key}" should be number in ${label}, got ${typeof obj[key]}`);
      }
    } else if (type === 'string') {
      if (typeof obj[key] !== 'string') {
        errors.push(`Field "${key}" should be string in ${label}, got ${typeof obj[key]}`);
      }
    }
  }
  return errors;
}

async function test(name, category, fn) {
  const start = performance.now();
  try {
    await fn();
    const elapsed = Math.round(performance.now() - start);
    passCount++;
    results.push({ name, category, status: 'PASS', elapsed, error: null });
  } catch (e) {
    const elapsed = Math.round(performance.now() - start);
    failCount++;
    results.push({ name, category, status: 'FAIL', elapsed, error: e.message });
  }
}

async function fetchJson(path, opts) {
  const res = await fetch(`${BASE}${path}`, opts);
  return { res, body: res.headers.get('content-type')?.includes('json') ? await res.json() : await res.text() };
}

// --- Schemas ---
const SCHEMAS = {
  post: { id: 'number', title: 'string', body: 'string', userId: 'number' },
  comment: { id: 'number', name: 'string', email: 'string', body: 'string', postId: 'number' },
  album: { id: 'number', title: 'string', userId: 'number' },
  photo: { id: 'number', title: 'string', url: 'string', thumbnailUrl: 'string', albumId: 'number' },
  todo: { id: 'number', title: 'string', completed: 'boolean', userId: 'number' },
  user: { id: 'number', name: 'string', username: 'string', email: 'string', address: 'object', phone: 'string', website: 'string', company: 'object' },
};

// ==============================
// 1. RESOURCE ENDPOINTS
// ==============================

await test('GET /posts - list all posts', 'Resource Endpoints', async () => {
  const { res, body } = await fetchJson('/posts');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  assert(Array.isArray(body), 'Response should be array');
  assert(body.length === 100, `Expected 100 posts, got ${body.length}`);
});

await test('GET /posts/1 - single post', 'Resource Endpoints', async () => {
  const { res, body } = await fetchJson('/posts/1');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  assert(body.id === 1, `Expected id=1, got ${body.id}`);
  const errs = validateSchema(body, SCHEMAS.post, 'post');
  assert(errs.length === 0, errs.join('; '));
});

await test('GET /posts?userId=1 - filtered posts', 'Resource Endpoints', async () => {
  const { res, body } = await fetchJson('/posts?userId=1');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  assert(Array.isArray(body), 'Response should be array');
  assert(body.length > 0, 'Should have results');
  assert(body.every(p => p.userId === 1), 'All posts should belong to userId=1');
});

await test('GET /comments - list all comments', 'Resource Endpoints', async () => {
  const { res, body } = await fetchJson('/comments');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  assert(Array.isArray(body), 'Response should be array');
  assert(body.length === 500, `Expected 500 comments, got ${body.length}`);
});

await test('GET /comments?postId=1 - filtered comments', 'Resource Endpoints', async () => {
  const { res, body } = await fetchJson('/comments?postId=1');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  assert(body.length > 0, 'Should have results');
  assert(body.every(c => c.postId === 1), 'All comments should belong to postId=1');
});

await test('GET /albums - list all albums', 'Resource Endpoints', async () => {
  const { res, body } = await fetchJson('/albums');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  assert(Array.isArray(body) && body.length === 100, `Expected 100 albums, got ${body.length}`);
});

await test('GET /photos - list all photos', 'Resource Endpoints', async () => {
  const { res, body } = await fetchJson('/photos');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  assert(Array.isArray(body) && body.length === 5000, `Expected 5000 photos, got ${body.length}`);
});

await test('GET /todos - list all todos', 'Resource Endpoints', async () => {
  const { res, body } = await fetchJson('/todos');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  assert(Array.isArray(body) && body.length === 200, `Expected 200 todos, got ${body.length}`);
});

await test('GET /users - list all users', 'Resource Endpoints', async () => {
  const { res, body } = await fetchJson('/users');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  assert(Array.isArray(body) && body.length === 10, `Expected 10 users, got ${body.length}`);
});

// ==============================
// 2. CRUD SIMULATION
// ==============================

await test('POST /posts - create a post (201)', 'CRUD Simulation', async () => {
  const payload = { title: 'AQE Contract Test', body: 'Validating API contract', userId: 1 };
  const { res, body } = await fetchJson('/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  assert(res.status === 201, `Expected 201, got ${res.status}`);
  assert(typeof body.id === 'number', `Expected numeric id, got ${typeof body.id}`);
  assert(body.title === payload.title, `Title mismatch`);
  assert(body.body === payload.body, `Body mismatch`);
  assert(body.userId === payload.userId, `UserId mismatch`);
});

await test('PUT /posts/1 - full update (200)', 'CRUD Simulation', async () => {
  const payload = { id: 1, title: 'Updated Title', body: 'Updated body', userId: 1 };
  const { res, body } = await fetchJson('/posts/1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  assert(body.title === 'Updated Title', 'Title should be updated');
});

await test('PATCH /posts/1 - partial update (200)', 'CRUD Simulation', async () => {
  const payload = { title: 'Patched Title' };
  const { res, body } = await fetchJson('/posts/1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  assert(body.title === 'Patched Title', 'Title should be patched');
});

await test('DELETE /posts/1 - delete (200)', 'CRUD Simulation', async () => {
  const res = await fetch(`${BASE}/posts/1`, { method: 'DELETE' });
  assert(res.status === 200, `Expected 200, got ${res.status}`);
});

// ==============================
// 3. NESTED RESOURCES
// ==============================

await test('GET /posts/1/comments - nested comments', 'Nested Resources', async () => {
  const { res, body } = await fetchJson('/posts/1/comments');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  assert(Array.isArray(body) && body.length > 0, 'Should have comments');
  assert(body.every(c => c.postId === 1), 'All comments should belong to post 1');
});

await test('GET /users/1/posts - nested posts', 'Nested Resources', async () => {
  const { res, body } = await fetchJson('/users/1/posts');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  assert(Array.isArray(body) && body.length > 0, 'Should have posts');
  assert(body.every(p => p.userId === 1), 'All posts should belong to user 1');
});

await test('GET /users/1/todos - nested todos', 'Nested Resources', async () => {
  const { res, body } = await fetchJson('/users/1/todos');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  assert(Array.isArray(body) && body.length > 0, 'Should have todos');
  assert(body.every(t => t.userId === 1), 'All todos should belong to user 1');
});

// ==============================
// 4. SCHEMA VALIDATION
// ==============================

await test('Schema: Post fields (id, title, body, userId)', 'Schema Validation', async () => {
  const { body } = await fetchJson('/posts/1');
  const errs = validateSchema(body, SCHEMAS.post, 'Post');
  assert(errs.length === 0, errs.join('; '));
});

await test('Schema: Comment fields (id, name, email, body, postId)', 'Schema Validation', async () => {
  const { body } = await fetchJson('/comments/1');
  const errs = validateSchema(body, SCHEMAS.comment, 'Comment');
  assert(errs.length === 0, errs.join('; '));
});

await test('Schema: User fields (id, name, username, email, address, phone, website, company)', 'Schema Validation', async () => {
  const { body } = await fetchJson('/users/1');
  const errs = validateSchema(body, SCHEMAS.user, 'User');
  assert(errs.length === 0, errs.join('; '));
});

await test('Schema: Todo fields (id, title, completed, userId)', 'Schema Validation', async () => {
  const { body } = await fetchJson('/todos/1');
  const errs = validateSchema(body, SCHEMAS.todo, 'Todo');
  assert(errs.length === 0, errs.join('; '));
});

await test('Schema: Album fields (id, title, userId)', 'Schema Validation', async () => {
  const { body } = await fetchJson('/albums/1');
  const errs = validateSchema(body, SCHEMAS.album, 'Album');
  assert(errs.length === 0, errs.join('; '));
});

await test('Schema: Photo fields (id, title, url, thumbnailUrl, albumId)', 'Schema Validation', async () => {
  const { body } = await fetchJson('/photos/1');
  const errs = validateSchema(body, SCHEMAS.photo, 'Photo');
  assert(errs.length === 0, errs.join('; '));
});

// ==============================
// 5. EDGE CASES
// ==============================

await test('GET /posts/999999 - non-existent resource returns 404', 'Edge Cases', async () => {
  const res = await fetch(`${BASE}/posts/999999`);
  assert(res.status === 404, `Expected 404, got ${res.status}`);
});

await test('GET /invalidendpoint - invalid endpoint returns 404', 'Edge Cases', async () => {
  const res = await fetch(`${BASE}/invalidendpoint`);
  assert(res.status === 404, `Expected 404, got ${res.status}`);
});

await test('POST /posts with empty body - returns 201 with id', 'Edge Cases', async () => {
  const { res, body } = await fetchJson('/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  // JSONPlaceholder accepts empty body and returns 201
  assert(res.status === 201, `Expected 201, got ${res.status}`);
  assert(typeof body.id === 'number', `Expected numeric id, got ${typeof body.id}`);
});

// ==============================
// GENERATE REPORT
// ==============================

const totalTime = results.reduce((s, r) => s + r.elapsed, 0);
const categories = [...new Set(results.map(r => r.category))];

let md = `# JSONPlaceholder API Contract Validation Report

**Date**: ${new Date().toISOString().split('T')[0]}
**Base URL**: ${BASE}
**Agent**: Agentic QE v3 - Contract Validator
**Method**: Real HTTP requests with schema validation

---

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${results.length} |
| Passed | ${passCount} |
| Failed | ${failCount} |
| Pass Rate | ${((passCount / results.length) * 100).toFixed(1)}% |
| Total Duration | ${totalTime}ms |
| Average Response | ${Math.round(totalTime / results.length)}ms |

---

`;

for (const cat of categories) {
  const catResults = results.filter(r => r.category === cat);
  const catPass = catResults.filter(r => r.status === 'PASS').length;
  md += `## ${cat} (${catPass}/${catResults.length})\n\n`;
  md += `| Status | Test | Time | Details |\n`;
  md += `|--------|------|------|---------|\n`;
  for (const r of catResults) {
    const icon = r.status === 'PASS' ? 'PASS' : 'FAIL';
    const detail = r.error || '-';
    md += `| ${icon} | ${r.name} | ${r.elapsed}ms | ${detail} |\n`;
  }
  md += '\n';
}

md += `## Contract Schemas Validated

| Resource | Required Fields | Status |
|----------|----------------|--------|
| Post | id, title, body, userId | ${results.find(r => r.name.includes('Schema: Post'))?.status || 'N/A'} |
| Comment | id, name, email, body, postId | ${results.find(r => r.name.includes('Schema: Comment'))?.status || 'N/A'} |
| User | id, name, username, email, address, phone, website, company | ${results.find(r => r.name.includes('Schema: User'))?.status || 'N/A'} |
| Todo | id, title, completed, userId | ${results.find(r => r.name.includes('Schema: Todo'))?.status || 'N/A'} |
| Album | id, title, userId | ${results.find(r => r.name.includes('Schema: Album'))?.status || 'N/A'} |
| Photo | id, title, url, thumbnailUrl, albumId | ${results.find(r => r.name.includes('Schema: Photo'))?.status || 'N/A'} |

## Response Time Distribution

| Bucket | Count |
|--------|-------|
| < 100ms | ${results.filter(r => r.elapsed < 100).length} |
| 100-300ms | ${results.filter(r => r.elapsed >= 100 && r.elapsed < 300).length} |
| 300-500ms | ${results.filter(r => r.elapsed >= 300 && r.elapsed < 500).length} |
| 500ms-1s | ${results.filter(r => r.elapsed >= 500 && r.elapsed < 1000).length} |
| > 1s | ${results.filter(r => r.elapsed >= 1000).length} |

## Breaking Change Analysis

**Provider**: JSONPlaceholder v1 (typicode)
**Consumers validated**: 6 resource types, CRUD operations, nested routes

| Check | Result |
|-------|--------|
| All documented endpoints respond | ${failCount === 0 ? 'PASS' : 'REVIEW'} |
| Response schemas match contract | ${results.filter(r => r.category === 'Schema Validation' && r.status === 'FAIL').length === 0 ? 'PASS' : 'FAIL'} |
| CRUD verbs return expected codes | ${results.filter(r => r.category === 'CRUD Simulation' && r.status === 'FAIL').length === 0 ? 'PASS' : 'FAIL'} |
| Nested resources resolve correctly | ${results.filter(r => r.category === 'Nested Resources' && r.status === 'FAIL').length === 0 ? 'PASS' : 'FAIL'} |
| Error responses are correct | ${results.filter(r => r.category === 'Edge Cases' && r.status === 'FAIL').length === 0 ? 'PASS' : 'FAIL'} |
| **can-i-deploy** | **${failCount === 0 ? 'YES' : 'NO - ' + failCount + ' failure(s)'}** |

---

*Generated by Agentic QE v3 Contract Validator | ${new Date().toISOString()}*
`;

// Write report
const fs = await import('fs');
fs.writeFileSync('/workspaces/cf-devpod/docs/demos/results/jsonplaceholder-api-report.md', md);

// Console summary
console.log('=== CONTRACT VALIDATION COMPLETE ===');
console.log(`Tests: ${results.length} | Passed: ${passCount} | Failed: ${failCount}`);
console.log(`Duration: ${totalTime}ms | Avg: ${Math.round(totalTime / results.length)}ms`);
console.log(`can-i-deploy: ${failCount === 0 ? 'YES' : 'NO'}`);
console.log('Report saved to: /workspaces/cf-devpod/docs/demos/results/jsonplaceholder-api-report.md');

// Output JSON for MCP consumption
const output = {
  summary: { total: results.length, passed: passCount, failed: failCount, duration: totalTime },
  results,
  canIDeploy: failCount === 0,
};
console.log('\n' + JSON.stringify(output, null, 2));
