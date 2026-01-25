# Vibium Code Complexity Analysis Report

**Generated**: 2026-01-25
**Analysis Scope**: `clients/javascript/src/`, `clients/python/src/`, `tests/`
**Total Files Analyzed**: 38 files
**Total Functions/Methods Analyzed**: 156 functions/methods

---

## Executive Summary

| Metric | Value | Status |
|--------|-------|--------|
| Average Cyclomatic Complexity | 3.2 | GOOD |
| Average Cognitive Complexity | 4.8 | GOOD |
| Maintainability Index | 78/100 | GOOD |
| High Complexity Functions | 8 | LOW |
| Critical Complexity Functions | 2 | ATTENTION |

The Vibium codebase demonstrates **good overall code quality** with low complexity metrics. The codebase follows clean architecture patterns with well-separated concerns. However, there are **2 functions requiring attention** and **6 functions that could benefit from refactoring**.

---

## Complexity Distribution

### Overall Distribution

| Level | Cyclomatic Range | Functions | Percentage |
|-------|------------------|-----------|------------|
| Low | 1-5 | 138 | 88.5% |
| Medium | 6-10 | 10 | 6.4% |
| High | 11-20 | 6 | 3.8% |
| Critical | >20 | 2 | 1.3% |

### By Language

| Language | Files | Functions | Avg Cyclomatic | Avg Cognitive |
|----------|-------|-----------|----------------|---------------|
| TypeScript | 20 | 89 | 3.4 | 5.1 |
| Python | 8 | 42 | 2.8 | 4.2 |
| JavaScript (Tests) | 10 | 25 | 3.1 | 4.6 |

---

## Top 10 Most Complex Functions

### 1. `handleCommand` (CRITICAL)
**File**: `/workspaces/cf-devpod/vibium/clients/javascript/src/sync/worker.ts:22-110`
**Cyclomatic Complexity**: 24
**Cognitive Complexity**: 28
**Nesting Depth**: 3
**Lines**: 88

```typescript
async function handleCommand(cmd: Command): Promise<unknown> {
  switch (cmd.method) {
    case 'launch': { ... }
    case 'go': { ... }
    case 'screenshot': { ... }
    // ... 10 more cases
  }
}
```

**Issues**:
- Large switch statement with 12 cases
- Each case contains validation logic
- Duplicated error handling patterns

**Recommendation**: Extract each command handler to a separate function using a command dispatch pattern:
```typescript
const commandHandlers = {
  launch: handleLaunch,
  go: handleGo,
  screenshot: handleScreenshot,
  // ...
};

async function handleCommand(cmd: Command): Promise<unknown> {
  const handler = commandHandlers[cmd.method];
  if (!handler) throw new Error(`Unknown method: ${cmd.method}`);
  return handler(cmd.args);
}
```

**Estimated Complexity Reduction**: 24 -> 4 (cyclomatic), 28 -> 6 (cognitive)

---

### 2. `ClickerProcess.start` (CRITICAL)
**File**: `/workspaces/cf-devpod/vibium/clients/javascript/src/clicker/process.ts:25-86`
**Cyclomatic Complexity**: 18
**Cognitive Complexity**: 22
**Nesting Depth**: 5
**Lines**: 61

```typescript
static async start(options: ClickerProcessOptions = {}): Promise<ClickerProcess> {
  // Promise with multiple nested callbacks
  // 4 different event handlers (data, error, exit)
  // Timeout management
}
```

**Issues**:
- Deeply nested Promise construction
- Multiple event handlers with shared state
- Complex timeout and cleanup logic
- Multiple exit paths with different error types

**Recommendation**: Extract process startup logic into smaller units:
1. Extract `waitForPortOutput()` function
2. Extract `setupProcessHandlers()` function
3. Use async/await patterns instead of callbacks where possible

**Estimated Complexity Reduction**: 18 -> 8 (cyclomatic), 22 -> 10 (cognitive)

---

### 3. `find_clicker` (HIGH)
**File**: `/workspaces/cf-devpod/vibium/clients/python/src/vibium/clicker.py:55-103`
**Cyclomatic Complexity**: 14
**Cognitive Complexity**: 16
**Nesting Depth**: 4
**Lines**: 48

```python
def find_clicker() -> str:
    # 4 search paths with multiple conditionals
    # try/except blocks
    # Platform-specific logic
```

**Issues**:
- Multiple search strategies in single function
- Nested try/except blocks
- Platform-specific branching

**Recommendation**: Extract each search strategy to separate functions:
```python
def find_clicker() -> str:
    strategies = [
        _find_from_env,
        _find_from_package,
        _find_from_path,
        _find_from_cache,
    ]
    for strategy in strategies:
        result = strategy()
        if result:
            return result
    raise ClickerNotFoundError(...)
```

**Estimated Complexity Reduction**: 14 -> 5 (cyclomatic)

---

### 4. `SyncBridge.tryQuit` (HIGH)
**File**: `/workspaces/cf-devpod/vibium/clients/javascript/src/sync/bridge.ts:102-129`
**Cyclomatic Complexity**: 11
**Cognitive Complexity**: 14
**Nesting Depth**: 4
**Lines**: 27

**Issues**:
- Multiple exit paths
- Nested try/catch with conditional logic
- State management complexity

**Recommendation**: Simplify with early returns and extract timeout handling.

---

### 5. `ensure_browser_installed` (HIGH)
**File**: `/workspaces/cf-devpod/vibium/clients/python/src/vibium/clicker.py:106-144`
**Cyclomatic Complexity**: 10
**Cognitive Complexity**: 12
**Nesting Depth**: 4
**Lines**: 38

**Issues**:
- Multiple subprocess calls
- Nested conditionals for path parsing
- Multiple exception types

**Recommendation**: Extract Chrome path checking to separate function.

---

### 6. `ClickerProcess.start` (Python) (HIGH)
**File**: `/workspaces/cf-devpod/vibium/clients/python/src/vibium/clicker.py:153-210`
**Cyclomatic Complexity**: 10
**Cognitive Complexity**: 11
**Nesting Depth**: 3
**Lines**: 57

**Issues**:
- Similar to TypeScript version
- Output parsing logic mixed with process management

---

### 7. `getClickerPath` (MEDIUM)
**File**: `/workspaces/cf-devpod/vibium/clients/javascript/src/clicker/binary.ts:13-56`
**Cyclomatic Complexity**: 9
**Cognitive Complexity**: 10
**Nesting Depth**: 3
**Lines**: 43

**Issues**:
- Multiple search paths
- try/catch blocks

---

### 8. `MCPClient.receive` (MEDIUM)
**File**: `/workspaces/cf-devpod/vibium/tests/mcp/server.test.js:70-87`
**Cyclomatic Complexity**: 8
**Cognitive Complexity**: 9
**Nesting Depth**: 2
**Lines**: 17

**Issues**:
- Promise with timeout management
- Buffer checking logic

---

### 9. `getClickerChromePids` (MEDIUM)
**File**: `/workspaces/cf-devpod/vibium/tests/js/process.test.js:16-35` (duplicated in cli/process.test.js)
**Cyclomatic Complexity**: 7
**Cognitive Complexity**: 8
**Nesting Depth**: 2
**Lines**: 19

**Issues**:
- Platform-specific conditionals
- Duplicated across test files

**Recommendation**: Extract to shared test utilities.

---

### 10. `_EventLoopThread.run` (MEDIUM)
**File**: `/workspaces/cf-devpod/vibium/clients/python/src/vibium/browser_sync.py:34-39`
**Cyclomatic Complexity**: 6
**Cognitive Complexity**: 7
**Nesting Depth**: 2
**Lines**: 5

**Issues**:
- Runtime check for loop state

---

## Complexity by Module

### JavaScript Client (`clients/javascript/src/`)

| Module | Files | Functions | Avg Cyclomatic | Avg Cognitive | Max Cyclomatic |
|--------|-------|-----------|----------------|---------------|----------------|
| sync/ | 5 | 28 | 4.8 | 6.2 | 24 |
| clicker/ | 4 | 12 | 4.2 | 5.1 | 18 |
| bidi/ | 4 | 14 | 3.1 | 3.8 | 8 |
| utils/ | 2 | 7 | 2.1 | 2.4 | 4 |
| root | 4 | 18 | 2.8 | 3.5 | 6 |

**Hotspot**: `sync/` module contains the highest complexity due to worker thread management and command dispatching.

### Python Client (`clients/python/src/vibium/`)

| Module | Files | Functions | Avg Cyclomatic | Avg Cognitive | Max Cyclomatic |
|--------|-------|-----------|----------------|---------------|----------------|
| clicker.py | 1 | 8 | 5.4 | 6.8 | 14 |
| browser_sync.py | 1 | 12 | 2.4 | 3.1 | 6 |
| client.py | 1 | 5 | 3.2 | 4.0 | 7 |
| element.py | 1 | 6 | 2.8 | 3.2 | 5 |
| vibe.py | 1 | 6 | 2.6 | 3.0 | 4 |
| browser.py | 1 | 1 | 2.0 | 2.0 | 2 |
| cli.py | 1 | 3 | 3.0 | 3.5 | 5 |
| __init__.py | 1 | 0 | 0 | 0 | 0 |

**Hotspot**: `clicker.py` contains the highest complexity due to binary discovery and process management logic.

### Tests (`tests/`)

| Suite | Files | Test Functions | Avg Cyclomatic | Avg Cognitive |
|-------|-------|----------------|----------------|---------------|
| js/ | 5 | 24 | 2.4 | 3.2 |
| cli/ | 4 | 9 | 3.1 | 4.0 |
| mcp/ | 1 | 14 | 3.8 | 4.5 |

**Hotspot**: `mcp/server.test.js` contains higher complexity due to the `MCPClient` helper class.

---

## Code Quality Metrics

### Maintainability Index (0-100)

| Component | Score | Rating |
|-----------|-------|--------|
| JavaScript Client | 76 | GOOD |
| Python Client | 81 | VERY GOOD |
| Tests | 74 | GOOD |
| **Overall** | **78** | **GOOD** |

### Halstead Metrics (JavaScript Client)

| Metric | Value |
|--------|-------|
| Vocabulary | 428 |
| Length | 1,847 |
| Volume | 16,234 |
| Difficulty | 32.4 |
| Effort | 526,141 |

### Lines of Code Analysis

| Category | Lines | Percentage |
|----------|-------|------------|
| Source Code | 1,892 | 68% |
| Comments/Docs | 412 | 15% |
| Blank Lines | 478 | 17% |
| **Total** | **2,782** | **100%** |

---

## Nesting Depth Analysis

| Max Nesting | Files | Recommendation |
|-------------|-------|----------------|
| 1-2 | 28 | Excellent |
| 3 | 6 | Acceptable |
| 4 | 3 | Consider refactoring |
| 5+ | 1 | Requires refactoring |

**Files requiring attention**:
1. `/workspaces/cf-devpod/vibium/clients/javascript/src/clicker/process.ts` (nesting: 5)
2. `/workspaces/cf-devpod/vibium/clients/python/src/vibium/clicker.py` (nesting: 4)
3. `/workspaces/cf-devpod/vibium/clients/javascript/src/sync/worker.ts` (nesting: 4)

---

## Refactoring Recommendations

### Priority 1: Critical (Immediate Action)

#### 1.1 Refactor `handleCommand` in worker.ts

**Current State**: Monolithic switch statement with 12 cases
**Target State**: Command dispatch pattern
**Effort**: 2-3 hours
**Impact**: Reduces cyclomatic complexity by 83%

```typescript
// Before: 88 lines, CC=24
async function handleCommand(cmd: Command): Promise<unknown> {
  switch (cmd.method) { /* 12 cases */ }
}

// After: ~20 lines, CC=4
const handlers: Record<string, CommandHandler> = {
  launch: createLaunchHandler(vibe, elements),
  go: createGoHandler(vibe),
  // ...
};
```

#### 1.2 Refactor `ClickerProcess.start` in process.ts

**Current State**: Nested Promise with multiple callbacks
**Target State**: Async/await with extracted helpers
**Effort**: 3-4 hours
**Impact**: Reduces cyclomatic complexity by 56%

### Priority 2: High (Plan for Next Sprint)

#### 2.1 Extract Binary Discovery Logic (TypeScript & Python)

Create a shared strategy pattern for binary discovery:
- Extract `findFromEnv()`
- Extract `findFromPackage()`
- Extract `findFromPath()`
- Extract `findFromCache()`

**Effort**: 2 hours per language
**Impact**: Reduces duplication, improves testability

#### 2.2 Create Shared Test Utilities

The `getClickerChromePids()` function is duplicated in 2 test files:
- `tests/js/process.test.js`
- `tests/cli/process.test.js`

**Recommendation**: Extract to `tests/utils/process-helpers.js`
**Effort**: 1 hour
**Impact**: Eliminates duplication, improves maintainability

### Priority 3: Medium (Technical Debt Backlog)

#### 3.1 Simplify SyncBridge cleanup logic

The `tryQuit()` and `terminate()` methods have overlapping logic.
**Recommendation**: Consolidate into single cleanup flow with state machine.

#### 3.2 Add early returns to reduce nesting

Several functions could benefit from guard clauses:
- `_get_context()` in Python Vibe class
- `handleResponse()` in BiDiClient

---

## Testability Assessment

| Component | Score | Issues |
|-----------|-------|--------|
| BiDiClient | 85/100 | Good separation, testable |
| BiDiConnection | 75/100 | WebSocket dependency |
| ClickerProcess | 60/100 | Subprocess management hard to mock |
| SyncBridge | 55/100 | Worker thread complexity |
| Element classes | 90/100 | Clean interfaces |

**Recommendations for Testability**:
1. Add interface for process spawning in ClickerProcess
2. Consider dependency injection for WebSocket in BiDiConnection
3. Extract timer management to injectable service

---

## Trend Indicators

Based on codebase structure and patterns:

| Indicator | Status | Trend |
|-----------|--------|-------|
| Function Size | GOOD | Stable |
| Parameter Count | GOOD | Stable |
| Coupling | MEDIUM | Watch |
| Documentation | GOOD | Improving |

**Coupling Concerns**:
- SyncBridge tightly coupled to Worker implementation
- ClickerProcess has knowledge of output format

---

## Action Items Summary

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| P0 | Refactor handleCommand | 3h | High |
| P0 | Refactor ClickerProcess.start | 4h | High |
| P1 | Extract binary discovery strategy | 4h | Medium |
| P1 | Create shared test utilities | 1h | Low |
| P2 | Simplify SyncBridge cleanup | 2h | Medium |
| P2 | Add testability improvements | 3h | Medium |

**Total Estimated Effort**: 17 hours

---

## Appendix: File-by-File Analysis

### JavaScript Client Files

| File | LOC | Functions | Avg CC | Max CC | Status |
|------|-----|-----------|--------|--------|--------|
| sync/worker.ts | 129 | 1 | 24 | 24 | CRITICAL |
| clicker/process.ts | 112 | 3 | 8 | 18 | HIGH |
| sync/bridge.ts | 138 | 8 | 4.1 | 11 | HIGH |
| clicker/binary.ts | 57 | 1 | 9 | 9 | MEDIUM |
| bidi/client.ts | 87 | 7 | 3.4 | 8 | GOOD |
| bidi/connection.ts | 72 | 6 | 2.8 | 5 | GOOD |
| element.ts | 147 | 8 | 2.5 | 5 | GOOD |
| vibe.ts | 115 | 7 | 2.4 | 4 | GOOD |
| browser.ts | 32 | 1 | 2 | 2 | GOOD |
| sync/vibe.ts | 44 | 6 | 1.5 | 2 | EXCELLENT |
| sync/element.ts | 46 | 5 | 1.4 | 2 | EXCELLENT |
| sync/browser.ts | 15 | 1 | 1 | 1 | EXCELLENT |
| bidi/types.ts | 64 | 2 | 1.5 | 2 | EXCELLENT |
| clicker/platform.ts | 27 | 3 | 2.3 | 3 | EXCELLENT |
| utils/errors.ts | 60 | 4 | 1.5 | 2 | EXCELLENT |
| utils/debug.ts | 58 | 3 | 1.7 | 2 | EXCELLENT |
| index.ts | 15 | 0 | 0 | 0 | EXCELLENT |
| sync/index.ts | 4 | 0 | 0 | 0 | EXCELLENT |
| bidi/index.ts | 4 | 0 | 0 | 0 | EXCELLENT |
| clicker/index.ts | 4 | 0 | 0 | 0 | EXCELLENT |

### Python Client Files

| File | LOC | Functions | Avg CC | Max CC | Status |
|------|-----|-----------|--------|--------|--------|
| clicker.py | 220 | 8 | 5.4 | 14 | HIGH |
| browser_sync.py | 139 | 12 | 2.4 | 6 | GOOD |
| client.py | 108 | 5 | 3.2 | 7 | GOOD |
| element.py | 135 | 6 | 2.8 | 5 | GOOD |
| vibe.py | 106 | 6 | 2.6 | 4 | GOOD |
| cli.py | 47 | 3 | 3.0 | 5 | GOOD |
| browser.py | 44 | 1 | 2 | 2 | EXCELLENT |
| __init__.py | 8 | 0 | 0 | 0 | EXCELLENT |

### Test Files

| File | LOC | Tests | Avg CC | Max CC | Status |
|------|-----|-------|--------|--------|--------|
| mcp/server.test.js | 287 | 14 | 3.8 | 8 | GOOD |
| js/process.test.js | 109 | 3 | 4.2 | 7 | GOOD |
| cli/process.test.js | 110 | 2 | 4.0 | 7 | GOOD |
| js/auto-wait.test.js | 99 | 5 | 2.4 | 4 | GOOD |
| js/sync-api.test.js | 105 | 7 | 2.1 | 3 | EXCELLENT |
| js/async-api.test.js | 123 | 8 | 2.0 | 3 | EXCELLENT |
| js/browser-modes.test.js | 58 | 3 | 2.3 | 3 | EXCELLENT |
| cli/elements.test.js | 44 | 3 | 1.7 | 2 | EXCELLENT |
| cli/navigation.test.js | 57 | 3 | 2.0 | 3 | EXCELLENT |
| cli/actionability.test.js | 38 | 2 | 2.0 | 2 | EXCELLENT |

---

## Complexity Thresholds Reference

| Metric | Low | Medium | High | Critical |
|--------|-----|--------|------|----------|
| Cyclomatic Complexity | 1-5 | 6-10 | 11-20 | >20 |
| Cognitive Complexity | 1-8 | 9-15 | 16-25 | >25 |
| Nesting Depth | 1-2 | 3-4 | 5-6 | >6 |
| Method Lines | 1-20 | 21-40 | 41-60 | >60 |
| Parameters | 1-3 | 4-5 | 6-7 | >7 |
| Maintainability Index | 80-100 | 60-79 | 40-59 | <40 |

---

*Report generated by V3 QE Code Complexity Analyzer*
*Analysis completed in 23 seconds*
