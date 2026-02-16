/**
 * Comprehensive Performance Test Suite
 * Targets: DemoBlaze API, Toolshop API
 * Tests: Baseline, Concurrent Load, Stress, Endurance
 */

import { writeFileSync } from 'fs';

const RESULTS_DIR = '/workspaces/cf-devpod/docs/demos/results';

// ─── Utility Functions ───────────────────────────────────────────────

function percentile(sorted, p) {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function stats(times) {
  if (times.length === 0) return { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 };
  const sorted = [...times].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    min: Math.round(sorted[0]),
    max: Math.round(sorted[sorted.length - 1]),
    avg: Math.round(sum / sorted.length),
    p50: Math.round(percentile(sorted, 50)),
    p95: Math.round(percentile(sorted, 95)),
    p99: Math.round(percentile(sorted, 99)),
  };
}

async function timedFetch(url, options = {}) {
  const start = performance.now();
  try {
    const res = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(15000),
    });
    const elapsed = performance.now() - start;
    const body = await res.text();
    return { status: res.status, elapsed, ok: res.ok, bodyLength: body.length, error: null };
  } catch (err) {
    const elapsed = performance.now() - start;
    return { status: 0, elapsed, ok: false, bodyLength: 0, error: err.message };
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function log(msg) {
  const ts = new Date().toISOString().slice(11, 23);
  console.log(`[${ts}] ${msg}`);
}

// ─── API Endpoint Definitions ────────────────────────────────────────

const DEMOBLAZE = {
  name: 'DemoBlaze',
  base: 'https://api.demoblaze.com',
  endpoints: {
    entries: { method: 'POST', path: '/entries', body: '' },
    view: { method: 'POST', path: '/view', body: JSON.stringify({ id: 1 }) },
    login: { method: 'POST', path: '/login', body: JSON.stringify({ username: 'perftest', password: 'perftest123' }) },
    addtocart: { method: 'POST', path: '/addtocart', body: JSON.stringify({ id: 'perf-test-' + Date.now(), cookie: 'perftest', prod_id: 1, flag: true }) },
  },
  mainEndpoint: 'entries',
};

const TOOLSHOP = {
  name: 'Toolshop',
  base: 'https://api.practicesoftwaretesting.com',
  endpoints: {
    products: { method: 'GET', path: '/products' },
    productById: { method: 'GET', path: '/products/01JMEBP6DK1YQA5Z1G0KCXKBQ3' },
    categories: { method: 'GET', path: '/categories' },
    brands: { method: 'GET', path: '/brands' },
    login: { method: 'POST', path: '/users/login', body: JSON.stringify({ email: 'customer@practicesoftwaretesting.com', password: 'welcome01' }), headers: { 'Content-Type': 'application/json' } },
  },
  mainEndpoint: 'products',
};

// ─── Test 1: Baseline Performance ────────────────────────────────────

async function runBaseline(api) {
  log(`--- Baseline: ${api.name} ---`);
  const results = {};

  for (const [name, ep] of Object.entries(api.endpoints)) {
    const opts = { method: ep.method };
    if (ep.body) opts.body = ep.body;
    if (ep.headers) opts.headers = ep.headers;
    else if (ep.method === 'POST') opts.headers = { 'Content-Type': 'application/json' };

    // Warmup
    await timedFetch(api.base + ep.path, opts);
    await sleep(200);

    // 3 runs, take median
    const runs = [];
    for (let i = 0; i < 3; i++) {
      const r = await timedFetch(api.base + ep.path, opts);
      runs.push(r);
      await sleep(200);
    }

    const times = runs.map(r => r.elapsed);
    const sorted = [...times].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const best = runs.reduce((a, b) => a.elapsed < b.elapsed ? a : b);

    results[name] = {
      medianMs: Math.round(median),
      minMs: Math.round(sorted[0]),
      maxMs: Math.round(sorted[sorted.length - 1]),
      status: best.status,
      bodyLength: best.bodyLength,
      error: best.error,
    };

    log(`  ${name}: median=${Math.round(median)}ms status=${best.status} size=${best.bodyLength}B`);
  }

  return results;
}

// ─── Test 2: Concurrent Load Test ────────────────────────────────────

async function runConcurrentLoad(api, concurrency) {
  const ep = api.endpoints[api.mainEndpoint];
  const opts = { method: ep.method };
  if (ep.body) opts.body = ep.body;
  if (ep.headers) opts.headers = ep.headers;
  else if (ep.method === 'POST') opts.headers = { 'Content-Type': 'application/json' };

  const url = api.base + ep.path;
  const startAll = performance.now();

  const promises = Array.from({ length: concurrency }, () => timedFetch(url, opts));
  const results = await Promise.all(promises);

  const totalTime = performance.now() - startAll;
  const times = results.map(r => r.elapsed);
  const errors = results.filter(r => !r.ok).length;
  const s = stats(times);

  return {
    concurrency,
    ...s,
    errorCount: errors,
    errorRate: ((errors / concurrency) * 100).toFixed(1) + '%',
    throughput: (concurrency / (totalTime / 1000)).toFixed(1),
    wallClockMs: Math.round(totalTime),
  };
}

async function runLoadSuite(api) {
  log(`--- Load Test: ${api.name} (endpoint: ${api.mainEndpoint}) ---`);
  const levels = [10, 25, 50];
  const results = [];

  for (const c of levels) {
    // Brief pause between levels
    await sleep(1000);
    const r = await runConcurrentLoad(api, c);
    results.push(r);
    log(`  ${c} concurrent: avg=${r.avg}ms p95=${r.p95}ms p99=${r.p99}ms errors=${r.errorCount} throughput=${r.throughput}rps`);
  }

  return results;
}

// ─── Test 3: Stress Test ─────────────────────────────────────────────

async function runStressTest(api) {
  log(`--- Stress Test: ${api.name} ---`);
  const results = [];
  let concurrency = 10;
  const MAX_CONCURRENCY = 150;

  while (concurrency <= MAX_CONCURRENCY) {
    await sleep(1500);
    const r = await runConcurrentLoad(api, concurrency);
    results.push(r);

    const errorRate = parseFloat(r.errorRate);
    log(`  ${concurrency} concurrent: avg=${r.avg}ms p95=${r.p95}ms errors=${r.errorRate}`);

    if (r.p95 > 5000 || errorRate > 20) {
      log(`  ** Breaking point reached at ${concurrency} concurrent requests **`);
      break;
    }

    concurrency += 10;
  }

  // Find degradation point (p95 > 2x the p95 at concurrency=10)
  const baselineP95 = results[0]?.p95 || 999;
  const degradationPoint = results.find(r => r.p95 > baselineP95 * 2 || parseFloat(r.errorRate) > 5);

  return {
    results,
    breakingPoint: concurrency,
    degradationPoint: degradationPoint ? degradationPoint.concurrency : null,
    baselineP95,
  };
}

// ─── Test 4: Endurance Test ──────────────────────────────────────────

async function runEnduranceTest(api) {
  log(`--- Endurance Test: ${api.name} (100 sequential requests, 100ms delay) ---`);
  const ep = api.endpoints[api.mainEndpoint];
  const opts = { method: ep.method };
  if (ep.body) opts.body = ep.body;
  if (ep.headers) opts.headers = ep.headers;
  else if (ep.method === 'POST') opts.headers = { 'Content-Type': 'application/json' };

  const url = api.base + ep.path;
  const dataPoints = [];

  for (let i = 0; i < 100; i++) {
    const r = await timedFetch(url, opts);
    dataPoints.push({
      index: i + 1,
      elapsed: Math.round(r.elapsed),
      status: r.status,
      ok: r.ok,
    });
    if (i % 20 === 0) {
      log(`  Request ${i + 1}/100: ${Math.round(r.elapsed)}ms (status=${r.status})`);
    }
    await sleep(100);
  }

  // Analyze drift: compare first 20 vs last 20
  const first20 = dataPoints.slice(0, 20).map(d => d.elapsed);
  const last20 = dataPoints.slice(-20).map(d => d.elapsed);
  const firstAvg = first20.reduce((a, b) => a + b, 0) / first20.length;
  const lastAvg = last20.reduce((a, b) => a + b, 0) / last20.length;
  const driftPercent = ((lastAvg - firstAvg) / firstAvg * 100).toFixed(1);

  const allTimes = dataPoints.map(d => d.elapsed);
  const s = stats(allTimes);

  log(`  Endurance stats: avg=${s.avg}ms p95=${s.p95}ms drift=${driftPercent}%`);

  return {
    totalRequests: 100,
    stats: s,
    firstWindowAvg: Math.round(firstAvg),
    lastWindowAvg: Math.round(lastAvg),
    driftPercent: parseFloat(driftPercent),
    errors: dataPoints.filter(d => !d.ok).length,
    dataPoints,
  };
}

// ─── Main Execution ──────────────────────────────────────────────────

async function main() {
  log('========================================');
  log('PERFORMANCE TEST SUITE START');
  log('========================================');

  const allData = {
    timestamp: new Date().toISOString(),
    demoblaze: {},
    toolshop: {},
  };

  // --- DemoBlaze ---
  log('');
  log('=== TARGET: DemoBlaze API ===');
  allData.demoblaze.baseline = await runBaseline(DEMOBLAZE);
  await sleep(2000);
  allData.demoblaze.loadTest = await runLoadSuite(DEMOBLAZE);
  await sleep(2000);
  allData.demoblaze.stressTest = await runStressTest(DEMOBLAZE);
  await sleep(2000);
  allData.demoblaze.endurance = await runEnduranceTest(DEMOBLAZE);

  await sleep(3000);

  // --- Toolshop ---
  log('');
  log('=== TARGET: Toolshop API ===');
  allData.toolshop.baseline = await runBaseline(TOOLSHOP);
  await sleep(2000);
  allData.toolshop.loadTest = await runLoadSuite(TOOLSHOP);
  await sleep(2000);
  allData.toolshop.stressTest = await runStressTest(TOOLSHOP);
  await sleep(2000);
  allData.toolshop.endurance = await runEnduranceTest(TOOLSHOP);

  // Save raw data
  writeFileSync(`${RESULTS_DIR}/performance-data.json`, JSON.stringify(allData, null, 2));
  log('');
  log('Raw data saved to performance-data.json');
  log('========================================');
  log('PERFORMANCE TEST SUITE COMPLETE');
  log('========================================');

  return allData;
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
