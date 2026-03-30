# Test Quality and Coverage Analysis Report

**Project:** LionAGI QE Fleet (`/workspaces/cf-devpod/tmp/lionagi-qe-fleet/`)
**Date:** 2026-03-23
**Analyst:** QE Test Architect v3
**Report ID:** 07-test-analysis-report

---

## Executive Summary

| Metric | Value | Rating |
|--------|-------|--------|
| **Overall Test Health Score** | **72 / 100** | ACCEPTABLE |
| Total Test Files | 68 | - |
| Total Test Functions | 1,378 | - |
| Total Test Lines | 28,733 | - |
| Source Files (non-init) | 75 | - |
| Source Lines | 23,466 | - |
| Test-to-Source Ratio | 1.22:1 | GOOD |
| Modules With Tests | 10 / 15 | 67% |
| Modules With No Tests | 5 | CRITICAL GAP |
| Property-Based Tests | Present in 5 files | LOW |
| Parameterized Tests | 2 files | VERY LOW |
| Fixtures (conftest.py) | 128 usages across 37 files | GOOD |

**Key Findings:**

1. **CRITICAL**: Five source modules have zero test coverage -- `tools`, `tracking`, `config`, `workers`, and most of `api/endpoints/`.
2. **STRONG**: Core modules (`core/`, `agents/`, `learning/`) have thorough unit tests with good assertion density and mock isolation.
3. **CONCERN**: Heavy reliance on mocking in agent tests means execution paths are validated at the interface level only, not the implementation level.
4. **POSITIVE**: Property-based testing (hypothesis) is used for chaos engineer, quality analyzer, quality gate, coverage analyzer, and API contract validator agents.
5. **RISK**: 25 occurrences of `asyncio.sleep` in tests indicate potential flakiness related to timing-dependent assertions.
6. **GAP**: Only 2 files use `@pytest.mark.parametrize` -- massive missed opportunity for combinatorial coverage.
7. **POSITIVE**: BDD scenarios exist in `docs/test-plans/` but have no automated step implementations (Gherkin without glue code).

---

## 1. Coverage Gap Matrix

### Source Module to Test Coverage Mapping

| Source Module | Source Files | Test Files | Coverage Level | Priority |
|---|---|---|---|---|
| `core/` | 8 (base_agent, fleet, hooks, memory, orchestrator, orchestrator_wip, router, task) | 12 (test_core/ + conftest) | **HIGH** -- All core files tested | - |
| `agents/` | 18 agents | 12 test files in test_agents/ | **MEDIUM** -- 12/18 agents tested | P1 |
| `learning/` | 6 (qlearner, state_encoder, reward_calculator, db_manager, validate, example_integration) | 4 (test_qlearner, test_state_encoder, test_reward_calculator, test_base_agent_integration) | **MEDIUM** -- 3/6 tested | P2 |
| `storage/` | 11 (backends/local, s3, ci, base, factory + models + utils) | 3 (test_local_storage, test_query, test_compression) | **MEDIUM** -- 3/11 tested | P2 |
| `badges/` | 5 (generator, cache, colors, api, cli) | 1 (test_badge_generator) | **MEDIUM** -- 3/5 classes tested in 1 file | P3 |
| `persistence/` | 2 (postgres_memory, redis_memory) | 2 (test_postgres_memory, test_redis_memory) | **HIGH** -- Both tested | - |
| `mcp/` | 2 (mcp_server, mcp_tools) | 4 (test_mcp_server, test_mcp_tools, + comprehensive versions) | **HIGH** -- Well covered | - |
| `api/` | 14 (server, auth, models, rate_limit, sdk/, endpoints/, workers/) | 1 (test_api_integration) | **LOW** -- 1/14 tested | P1 |
| `cli/` | 4 (base, ci_mode, examples, output) | 4 (test_base, test_ci_mode, test_examples, test_output) | **HIGH** -- All tested | - |
| `integrations/` | 1 (agentdb) | 1 (test_agentdb) | **HIGH** -- Tested | - |
| `tools/` | 1 (code_analyzer) | 0 | **NONE** | P1 |
| `tracking/` | 1 (risk_dependency_tracker) | 0 | **NONE** | P1 |
| `config/` | 1 (storage_config) | 0 | **NONE** | P2 |
| `workers/` | 1 (tasks) | 0 | **NONE** | P2 |

### Untested Agent Source Files (6 of 18)

| Agent | Source File | Status |
|---|---|---|
| `code_complexity` | `agents/code_complexity.py` | NO TESTS |
| `deployment_readiness` | `agents/deployment_readiness.py` | NO TESTS |
| `performance_tester` | `agents/performance_tester.py` | NO TESTS |
| `production_intelligence` | `agents/production_intelligence.py` | NO TESTS |
| `regression_risk_analyzer` | `agents/regression_risk_analyzer.py` | NO TESTS |
| `requirements_validator` | `agents/requirements_validator.py` | NO TESTS |
| `security_scanner` | `agents/security_scanner.py` | NO TESTS |
| `test_data_architect` | `agents/test_data_architect.py` | NO TESTS |
| `visual_tester` | `agents/visual_tester.py` | NO TESTS |

Note: While `test_agents/` has 12 test files covering `base_agent`, `fleet_commander`, `quality_analyzer`, `test_generator`, `coverage_analyzer`, `test_executor`, `chaos_engineer`, `quality_gate`, `api_contract_validator`, and the alcall integration variants, 9 of 18 agent implementations have no dedicated unit tests.

### Untested API Endpoints

| Endpoint Module | Source File | Status |
|---|---|---|
| `endpoints/coverage.py` | Coverage API endpoints | NO TESTS |
| `endpoints/fleet.py` | Fleet management endpoints | NO TESTS |
| `endpoints/jobs.py` | Job management endpoints | NO TESTS |
| `endpoints/performance.py` | Performance test endpoints | NO TESTS |
| `endpoints/quality.py` | Quality gate endpoints | NO TESTS |
| `endpoints/security.py` | Security scan endpoints | NO TESTS |
| `endpoints/test.py` | Test execution endpoints | NO TESTS |
| `auth.py` | Authentication/authorization | NO TESTS |
| `rate_limit.py` | Rate limiting middleware | NO TESTS |
| `models.py` | API request/response models | NO TESTS |
| `sdk/client.py` | SDK client | NO TESTS |
| `sdk/exceptions.py` | SDK exceptions | NO TESTS |
| `workers/tasks.py` | Background worker tasks | NO TESTS |

---

## 2. Test Quality Scorecard

### Per-Directory Quality Assessment

| Test Directory | Files | Tests | Assertion Density | Mock Usage | Edge Cases | Isolation | Score |
|---|---|---|---|---|---|---|---|
| `tests/test_agents/` | 12 | ~300 | HIGH (3-5 per test) | HEAVY (all tests mock `operate`) | GOOD (error paths, fallbacks) | GOOD (per-test fixtures) | **82/100** |
| `tests/test_core/` | 10 | ~250 | HIGH (2-4 per test) | MODERATE | EXCELLENT (lifecycle, concurrent, empty) | EXCELLENT | **88/100** |
| `tests/learning/` | 4 | ~100 | HIGH (mathematical verification) | MODERATE (db_manager mocked) | EXCELLENT (NaN, inf, bounds, zero) | EXCELLENT | **90/100** |
| `tests/storage/` | 3 | ~40 | MODERATE (2-3 per test) | LOW (uses real temp dirs) | GOOD (large files, no-compress) | EXCELLENT | **85/100** |
| `tests/mcp/` | 4 | ~40 | MODERATE | MODERATE | MODERATE | GOOD | **75/100** |
| `tests/integration/` | 10 | ~120 | MODERATE | LOW (real backends) | MODERATE | MODERATE (shared state) | **70/100** |
| `tests/persistence/` | 2 | ~50 | MODERATE | LOW (requires real DBs) | MODERATE | MODERATE | **68/100** |
| `tests/cli/` | 4 | ~40 | MODERATE | HIGH | GOOD | GOOD | **78/100** |
| `tests/api/` | 1 | ~10 | LOW | LOW | LOW | LOW | **45/100** |
| `tests/chaos/` | 6 | ~80 | MODERATE | MODERATE (chaostoolkit) | MODERATE | MODERATE | **72/100** |
| `tests/unit/` | 1 | ~15 | MODERATE | MODERATE | MODERATE | MODERATE | **70/100** |
| Root tests | 3 | ~60 | MODERATE | MODERATE | MODERATE | MODERATE | **72/100** |

### Assertion Quality Analysis

- **Total `assert` statements:** ~2,200+ across all test files
- **Average assertions per test function:** ~1.6 (ACCEPTABLE, target is 2-3)
- **`pytest.raises` usage:** 59 occurrences across 25 files (GOOD error path testing)
- **Assertion specificity:** Mostly exact value matching with `==`, some use `in` and comparison operators -- GOOD
- **Negative assertions:** Present but underrepresented; most tests verify happy paths

### Mock Usage Assessment

- **Total mock usage:** ~800+ occurrences (mocker, Mock, MagicMock, AsyncMock, @patch)
- **Mock pattern:** Agents consistently mock `operate()` and `communicate()` on `agent.branch` -- this is architecturally correct as these are the LLM call boundaries
- **Risk:** Over-mocking in agent tests means the actual execution path within `execute()` is tested only through mock interactions, not real behavior
- **Recommendation:** Add integration tests that verify agent `execute()` with stub LLM responses rather than mocking the entire operate chain

---

## 3. Test Architecture Assessment

### Test Organization

**Positive Findings:**
- Clear directory structure mirroring source layout (`test_agents/`, `test_core/`, `learning/`, `storage/`, etc.)
- Separate `integration/` directory with proper markers (`@pytest.mark.integration`, `@pytest.mark.postgres`, `@pytest.mark.redis`)
- Root `conftest.py` with shared fixtures, assertion helpers, and data generators
- `learning/conftest.py` with specialized Q-learning fixtures, mock factories, and assertion helpers
- `integration/conftest.py` with database connection management

**Issues Found:**
- **Duplicate test directories**: Both `tests/core/` and `tests/test_core/` exist with overlapping concerns (`test_hooks_integration.py` appears in both). This is confusing.
- **Root-level test files**: `test_badge_generator.py`, `test_react_integration.py`, `test_v102_compatibility.py` should be organized into appropriate subdirectories.
- **No standardized naming pattern**: Some tests use `test_<module>.py` (standard), others use `test_<module>_alcall.py`, `test_<module>_comprehensive.py`, `test_<module>_advanced.py` without clear convention.
- **Test fixture files in `tests/fixtures/`** are substantial (factories, generators, compliance, seeds) but their integration into tests is unclear.

### Fixture Architecture

**conftest.py Analysis:**

| Conftest Location | Fixtures | Quality |
|---|---|---|
| `tests/conftest.py` | 16 fixtures (qe_memory, model_router, agents, sample data, mocks) | EXCELLENT -- well-documented, proper async, helpers included |
| `tests/learning/conftest.py` | 19 fixtures (mock DB, Q-learning components, data generators, assertion helpers) | EXCELLENT -- comprehensive, well-layered |
| `tests/integration/conftest.py` | 10 fixtures (database connections, cleanup) | GOOD |
| `tests/persistence/conftest.py` | 13 fixtures (real DB connections) | GOOD |

**Fixture Anti-patterns:**
- Some test files define their own fixtures inline instead of using conftest (e.g., `test_badge_generator.py` has its own `generator` fixture)
- The `event_loop` fixture in root conftest is deprecated in newer pytest-asyncio versions

### Test Naming Conventions

**Strengths:**
- Consistent class-based grouping (`class TestQEMemory`, `class TestFleetCommanderAgent`)
- Descriptive test method names (`test_execute_without_orchestrator_fallback`, `test_cost_alert_only_triggers_once_per_threshold`)
- Clear Arrange-Act-Assert (AAA) pattern in most tests

**Weaknesses:**
- Some test names are too generic (`test_init`, `test_execute`, `test_metrics_tracking`)
- No BDD-style naming convention (`test_should_...`, `test_when_...then_...`)

---

## 4. Test Pyramid Assessment

### Current Distribution

```
                    /\
                   /  \
                  / E2E \        ~20 tests (1.5%)
                 /  (1%)  \      Target: 10%
                /----------\
               /            \
              / Integration  \   ~200 tests (14.5%)
             /    (15%)       \  Target: 20%
            /------------------\
           /                    \
          /     Unit Tests       \  ~1,158 tests (84%)
         /       (84%)           \  Target: 70%
        /________________________\
```

| Test Type | Count | Percentage | Target | Assessment |
|---|---|---|---|---|
| Unit Tests | ~1,158 | 84% | 70% | OVER-WEIGHTED (but acceptable) |
| Integration Tests | ~200 | 14.5% | 20% | SLIGHTLY UNDER |
| E2E Tests | ~20 | 1.5% | 10% | SEVERELY UNDER |

**Analysis:**
- The test pyramid is bottom-heavy, which is generally good, but the near-absence of E2E tests is a significant gap.
- The CI/CD pipeline simulation (`test_cicd_pipeline_scenario.py`) is the closest to an E2E test but uses TestClient (not a real server).
- Integration tests for PostgreSQL and Redis backends exist but require external infrastructure (`docker-compose-test.yml`).
- Missing: true end-to-end tests that exercise the full stack (CLI -> API -> Agents -> Storage -> Reporting).

### Test Type Breakdown

| Category | Test Files | Key Pattern |
|---|---|---|
| Pure Unit (isolated, mocked) | 30+ files | Mock `operate()`, verify outputs |
| Component Integration | ~10 files | Real memory, real storage, real badge generation |
| Infrastructure Integration | ~8 files | PostgreSQL, Redis, WebSocket connections |
| Contract Tests | 3 files (Pact) | CLI, GitHub Actions, GitLab CI consumers |
| Chaos/Resilience | 6 files | Network, storage, resource exhaustion |
| Compatibility | 2 files | v1.0.2 compat, deprecation tests |
| Property-Based | 5 files (embedded) | Hypothesis generators for score ranges, blast radius |

---

## 5. Anti-Pattern Catalog

### CRITICAL Anti-Patterns

| ID | Anti-Pattern | Severity | Location | Description |
|---|---|---|---|---|
| AP-01 | **Sleep-based assertions** | HIGH | 15 test files | `asyncio.sleep(1.1)` used for TTL expiration testing in memory tests. Creates timing-dependent failures. Use `freezegun` or manual clock advancement instead. |
| AP-02 | **time.sleep in tests** | HIGH | 3 files (integration, executor_alcall, badge_generator) | Blocking sleeps add latency and create race conditions. |
| AP-03 | **Over-mocking of agent execution** | MEDIUM | All agent tests | Every agent test mocks `operate()`, meaning the actual LLM prompt construction, context assembly, and result parsing within `execute()` is never tested end-to-end. |
| AP-04 | **Duplicate test directories** | MEDIUM | `tests/core/` vs `tests/test_core/` | Both contain hooks integration tests, causing confusion about canonical location. |

### MODERATE Anti-Patterns

| ID | Anti-Pattern | Severity | Location | Description |
|---|---|---|---|---|
| AP-05 | **Missing parameterization** | MEDIUM | Global | Only 2 files use `@pytest.mark.parametrize`. Many tests iterate manually over lists (e.g., priority levels, configuration variants) that should be parameterized. |
| AP-06 | **Property tests too shallow** | LOW | quality_analyzer, quality_gate | Property tests like `test_score_range` only verify `0 <= score <= 100` on a generated float -- this tests Python's float type, not production code. |
| AP-07 | **Shared mutable state in concurrent tests** | MEDIUM | test_base_agent (concurrent_operations) | Concurrent tests use shared QEMemory without proper synchronization verification. |
| AP-08 | **Non-deterministic test order** | LOW | test_qlearner (epsilon_greedy) | Tests rely on statistical outcomes (e.g., "at least 70% should be best action") which can fail with unlucky random seeds. |
| AP-09 | **Internal state inspection** | LOW | test_memory, test_base_agent | Tests access `qe_memory._store` directly, coupling to implementation details. |
| AP-10 | **Missing error message verification** | LOW | Several files | `pytest.raises(Exception)` without `match=` parameter, accepting any exception. |

### LOW-SEVERITY Anti-Patterns

| ID | Anti-Pattern | Severity | Location | Description |
|---|---|---|---|---|
| AP-11 | **Root-level test files** | LOW | tests/ root | `test_badge_generator.py`, `test_react_integration.py` should be in subdirectories. |
| AP-12 | **Deprecated event_loop fixture** | LOW | tests/conftest.py | `@pytest.fixture def event_loop()` is deprecated in pytest-asyncio 0.21+. Use `@pytest.fixture(scope="session")` or the `asyncio_mode = "auto"` config. |
| AP-13 | **asyncio.run in sync test** | LOW | test_badge_generator.py (test_cache_invalidation) | Uses `asyncio.run()` inside a synchronous test method instead of marking as `@pytest.mark.asyncio`. |

---

## 6. Missing Test Cases -- Recommendations

### P0 -- CRITICAL (Must Add)

| # | Missing Test | Target Module | Rationale |
|---|---|---|---|
| 1 | **API endpoint unit tests** | `api/endpoints/*.py` | 7 endpoint modules with zero tests. These are the primary interface for CI/CD integration. |
| 2 | **API authentication tests** | `api/auth.py` | Security-critical module with no tests. Must verify token validation, RBAC, and auth failure paths. |
| 3 | **API rate limiting tests** | `api/rate_limit.py` | Must verify rate limit enforcement, headers, and bypass scenarios. |
| 4 | **Security scanner agent tests** | `agents/security_scanner.py` | Security is a core quality pillar. Zero tests for this agent. |
| 5 | **Code complexity agent tests** | `agents/code_complexity.py` | Complexity analysis drives routing decisions -- must be tested. |

### P1 -- HIGH (Should Add Within Sprint)

| # | Missing Test | Target Module | Rationale |
|---|---|---|---|
| 6 | **Performance tester agent tests** | `agents/performance_tester.py` | Performance testing is a core capability. |
| 7 | **Deployment readiness agent tests** | `agents/deployment_readiness.py` | Go/no-go decisions depend on this agent. |
| 8 | **Requirements validator agent tests** | `agents/requirements_validator.py` | Requirements traceability is untested. |
| 9 | **Risk dependency tracker tests** | `tracking/risk_dependency_tracker.py` | Dependency-based risk analysis is untested. |
| 10 | **Code analyzer tool tests** | `tools/code_analyzer.py` | The only tool module, with zero tests. |
| 11 | **Storage backend factory tests** | `storage/backends/factory.py` | Backend selection logic is untested. |
| 12 | **S3 storage backend tests** | `storage/backends/s3.py` | Cloud storage path is untested. |
| 13 | **CI storage backend tests** | `storage/backends/ci.py` | CI-specific storage is untested. |
| 14 | **SDK client tests** | `api/sdk/client.py` | The SDK client has no tests. |

### P2 -- MEDIUM (Add Within Month)

| # | Missing Test | Target Module | Rationale |
|---|---|---|---|
| 15 | **Visual tester agent tests** | `agents/visual_tester.py` | Visual regression testing capability untested. |
| 16 | **Test data architect agent tests** | `agents/test_data_architect.py` | Data generation is untested. |
| 17 | **Production intelligence agent tests** | `agents/production_intelligence.py` | Production monitoring integration untested. |
| 18 | **Regression risk analyzer agent tests** | `agents/regression_risk_analyzer.py` | Risk-based test selection untested. |
| 19 | **Learning db_manager tests** | `learning/db_manager.py` | Database operations for Q-learning have no unit tests. |
| 20 | **Learning validate module tests** | `learning/validate.py` | Validation logic untested. |
| 21 | **Storage retention utility tests** | `storage/utils/retention.py` | Data retention policies untested. |
| 22 | **Storage index utility tests** | `storage/utils/index.py` | Artifact indexing untested. |
| 23 | **Storage config model tests** | `config/storage_config.py` and `storage/models/storage_config.py` | Configuration models untested. |
| 24 | **Workers tasks tests** | `workers/tasks.py` | Background worker tasks untested. |
| 25 | **API models tests** | `api/models.py` | Request/response models untested. |

---

## 7. Test Maintainability Assessment

### Setup/Teardown Patterns

| Pattern | Usage | Quality |
|---|---|---|
| pytest fixtures (`@pytest.fixture`) | 128 usages | EXCELLENT -- fixtures are well-scoped and documented |
| conftest.py hierarchy | 4 conftest files | GOOD -- proper layering (root -> domain-specific) |
| Async fixtures | Widely used | GOOD -- proper `async def` with `await` |
| Temp directories | `tempfile.TemporaryDirectory` in storage tests | EXCELLENT -- auto-cleanup |
| Database cleanup | `clean_db` fixture in learning conftest | GOOD |
| Factory functions | `generate_test_tasks()`, `generate_agent_results()`, `sample_task_factory()` | EXCELLENT |
| Assertion helpers | `assert_task_completed()`, `assert_q_value_in_range()`, `assert_trajectory_valid()` | EXCELLENT |

### Helper and Utility Usage

**Strengths:**
- `tests/learning/conftest.py` provides a comprehensive mock infrastructure for Q-learning with 19 fixtures
- Root conftest provides data generators (`generate_test_tasks`, `generate_agent_results`)
- Assertion helpers reduce duplication and improve readability
- `tests/fixtures/cicd_phase1/` contains factories, generators, and compliance utilities for CI/CD testing

**Weaknesses:**
- No shared test utilities module (e.g., `tests/utils.py`) for common patterns
- Mock agent classes are redefined in multiple test files (`MockQEAgent`, `MockAgent`, `TestAgent`) instead of being shared
- No test data builders for complex domain objects (e.g., `QualityGateDecision`, `ChaosExperimentResult`)

### Parameterization Usage

- **Current:** Only 2 files use `@pytest.mark.parametrize` (in fixture examples and BDD scenario outlines)
- **Missed Opportunities:**
  - Task priority levels (4 values, tested with manual loops)
  - Fleet configuration variants (4 configs, tested with manual loops)
  - Agent types (18 agents, could be parameterized)
  - Badge types and styles (manual iteration)
  - Error scenarios (could be parameterized with error type + expected behavior)

---

## 8. BDD/Scenario Coverage Assessment

### BDD Scenarios vs Test Implementation

The project has **315 BDD scenarios** in `docs/test-plans/phase1-bdd-scenarios.feature` covering:

| Milestone | Feature | Scenarios | Test Implementation |
|---|---|---|---|
| 1.1 CLI Enhancements | JSON output, quiet mode, non-interactive | ~30 | PARTIAL -- `tests/cli/` covers basic CLI but not all BDD scenarios |
| 1.2 Exit Codes | Standard exit codes, CI/CD compatibility | ~20 | PARTIAL -- `tests/cli/test_ci_mode.py` covers some |
| 1.3 CI/CD Templates | GitHub Actions, GitLab CI, Jenkins | ~25 | PARTIAL -- Pact consumer tests exist but lack full coverage |
| 2.1 Artifact Storage | Store/retrieve/list/delete artifacts | ~20 | GOOD -- `tests/storage/test_local_storage.py` covers most |
| 2.2 Badge Generation | Coverage, quality, security badges | ~20 | GOOD -- `tests/test_badge_generator.py` covers most |
| 3.1 Security Integration | SAST, dependency scanning | ~20 | NONE -- No security scanner tests |
| 3.2 Quality Gates | Go/no-go decisions | ~20 | GOOD -- `tests/test_agents/test_quality_gate.py` covers |

**Key Gap:** BDD scenarios are written in Gherkin format but there is NO step definition implementation (no `behave`, `pytest-bdd`, or equivalent glue code). These scenarios exist as documentation only, not as executable specifications.

---

## 9. Test Architecture Recommendations

### Immediate Actions (This Sprint)

1. **Consolidate duplicate directories**: Merge `tests/core/` into `tests/test_core/` (or vice versa). Pick one naming convention and stick with it.

2. **Move root-level test files**: Relocate `test_badge_generator.py` to `tests/badges/`, `test_react_integration.py` to `tests/integration/`, and `test_v102_compatibility.py` to `tests/compatibility/`.

3. **Replace `asyncio.sleep` with deterministic time control**: Use `freezegun` or a custom time provider to test TTL expiration without real delays. This alone will reduce test suite runtime by 15-20 seconds.

4. **Create shared mock agent module**: Extract `MockQEAgent`, `MockAgent`, `TestAgent` into `tests/helpers/mock_agents.py` to eliminate duplication across 5+ files.

5. **Fix deprecated `event_loop` fixture**: Replace with `pytest-asyncio` auto mode or session-scoped fixture.

### Short-Term Actions (Within 2 Sprints)

6. **Add API endpoint tests**: This is the largest coverage gap. Create `tests/api/endpoints/` with tests for all 7 endpoint modules using FastAPI's `TestClient`.

7. **Add remaining agent tests**: Write tests for the 9 untested agents. Since the pattern is well-established in existing agent tests, this should follow the same mock-operate pattern.

8. **Implement parameterized tests**: Convert manual iteration loops to `@pytest.mark.parametrize` for:
   - Priority levels in `test_task.py`
   - Configuration variants in `test_fleet.py`
   - Agent types across fleet tests
   - Badge types in `test_badge_generator.py`

9. **Add meaningful property-based tests**: Replace the trivial `test_score_range` tests with actual property tests that exercise production code, e.g.:
   - Property: For any valid task, `mark_completed` followed by `mark_failed` should always set status to `failed`
   - Property: Q-value updates should be bounded by learning rate
   - Property: Memory store followed by retrieve should return equivalent value for any serializable input

10. **Implement BDD step definitions**: Either adopt `pytest-bdd` to make the existing Gherkin scenarios executable, or convert the most critical scenarios to pytest test cases.

### Long-Term Actions (Next Quarter)

11. **Create E2E test suite**: Build true end-to-end tests that exercise CLI -> API -> Agent -> Storage -> Badge generation without mocks.

12. **Add mutation testing**: Use `mutmut` or `cosmic-ray` to validate that existing tests actually catch regressions, not just execute code paths.

13. **Test data builders**: Create builder patterns for complex domain objects (`QualityGateDecision.builder().with_go_decision().with_high_coverage().build()`) to reduce test setup boilerplate.

14. **Contract test completion**: Finish the Pact contract tests in `tests/contracts/` to verify API compatibility with CI/CD consumers.

15. **Performance regression tests**: Add benchmarks for critical paths (agent execution time, memory operations, storage throughput) using `pytest-benchmark`.

---

## 10. Priority List of Tests to Add

Ordered by risk and impact:

| Priority | Test to Add | Risk if Missing | Estimated Effort |
|---|---|---|---|
| 1 | API endpoint tests (7 endpoint modules) | HIGH -- Primary user-facing interface untested | 3-4 days |
| 2 | API auth + rate limiting tests | HIGH -- Security vulnerability risk | 1-2 days |
| 3 | Security scanner agent tests | HIGH -- Security quality pillar untested | 1 day |
| 4 | SDK client tests | MEDIUM -- Consumer-facing API untested | 1 day |
| 5 | 9 remaining agent unit tests | MEDIUM -- Coverage gaps in core agents | 3-4 days |
| 6 | tools/code_analyzer tests | MEDIUM -- Code analysis reliability | 0.5 days |
| 7 | tracking/risk_dependency_tracker tests | MEDIUM -- Risk analysis accuracy | 0.5 days |
| 8 | Storage backend factory + S3 + CI tests | MEDIUM -- Cloud deployment paths untested | 1-2 days |
| 9 | learning/db_manager + validate tests | MEDIUM -- Learning persistence gaps | 1 day |
| 10 | Workers/tasks background job tests | LOW -- Background processing | 0.5 days |
| 11 | Storage utility tests (retention, index) | LOW -- Data management | 0.5 days |
| 12 | API models validation tests | LOW -- Input validation | 0.5 days |
| 13 | E2E integration tests (full pipeline) | MEDIUM -- System-level confidence | 2-3 days |
| 14 | Parameterize existing manual loops | LOW -- Maintainability improvement | 1 day |
| 15 | Replace asyncio.sleep with time mocks | LOW -- Flakiness reduction | 0.5 days |

**Total estimated effort to reach 90% module coverage: ~18-22 developer-days**

---

## Appendix A: Test File Inventory

### tests/test_agents/ (12 files, ~300 tests)
- `test_base_agent.py` -- 22 tests, BaseQEAgent lifecycle and memory integration
- `test_fleet_commander.py` -- 12 tests, task decomposition and coordination
- `test_quality_analyzer.py` -- 7 tests + property tests, quality metrics analysis
- `test_test_generator.py` -- 21 tests, test generation workflows
- `test_coverage_analyzer.py` -- 17 tests + property tests, coverage gap detection
- `test_test_executor.py` -- 16 tests, test execution with alcall
- `test_chaos_engineer.py` -- 17 tests + property tests, chaos experiment lifecycle
- `test_quality_gate.py` -- 7 tests + property tests, go/no-go decisions
- `test_api_contract_validator.py` -- 17 tests + property tests, API contract validation
- `test_alcall_integration.py` -- 21 tests, alcall multi-agent coordination
- `test_executor_alcall.py` -- 21 tests, executor with alcall patterns
- `test_flaky_hunter_alcall.py` -- 24 tests, flaky test detection with alcall

### tests/test_core/ (10 files, ~250 tests)
- `test_orchestrator.py` -- 19 tests, pipeline/parallel/fan-out-fan-in execution
- `test_fleet.py` -- 22 tests, fleet lifecycle and configuration
- `test_memory.py` -- 18 tests, memory CRUD, TTL, partitions, persistence
- `test_router.py` -- 12 tests, model routing and cost optimization
- `test_task.py` -- 25+ tests, task state machine and serialization
- `test_hooks_integration.py` -- 30+ tests, cost alerts, token tracking, metrics
- `test_fleet_deprecation.py` -- 10 tests, backward compatibility
- `test_base_agent_fuzzy.py` -- 26 tests, fuzzy JSON parsing and safe_operate
- `test_orchestrator_advanced.py` -- 39 tests, advanced orchestration patterns
- `test_orchestrator_wip.py` -- 17 tests, work-in-progress orchestrator features

### tests/learning/ (4 files, ~100 tests)
- `test_qlearner.py` -- 34 tests, Q-learning core (epsilon-greedy, Bellman, decay, edge cases)
- `test_state_encoder.py` -- 20 tests, state encoding and feature extraction
- `test_reward_calculator.py` -- 20+ tests, reward computation
- `test_base_agent_integration.py` -- 29 tests, agent-learning integration

### tests/integration/ (10 files, ~120 tests)
- `test_cicd_pipeline_scenario.py` -- 1 comprehensive pipeline simulation test
- `test_phase1_cicd_integration.py` -- 2+ tests, Phase 1 CI/CD integration
- `test_memory_backends.py` -- 15 tests, memory backend interoperability
- `test_agent_memory_e2e.py` -- 28 tests, agent coordination via shared memory
- `test_websocket_streaming.py` -- Streaming integration tests
- `test_qlearning_persistence.py` -- 18 tests, Q-learning persistence
- `test_redis_memory_integration.py` -- 60 tests, Redis memory integration
- `test_postgres_memory_integration.py` -- 51 tests, PostgreSQL memory integration
- `test_phase1_validation.py` -- 3 tests, Phase 1 validation
- `run_phase1_integration_tests.py` -- Test runner script

---

## Appendix B: Metrics Summary

```
Source Code:
  Modules:           15
  Source Files:       75 (excluding __init__.py)
  Source Lines:       23,466

Test Code:
  Test Files:         68
  Test Functions:     1,378
  Test Lines:         28,733
  conftest.py files:  4
  Fixtures:           128 usages

Quality Indicators:
  Test:Source Ratio:  1.22:1 (lines)
  Tests:Source Files: 0.91:1
  Assertions/Test:    ~1.6 (target: 2-3)
  pytest.raises:      59 occurrences
  Property Tests:     5 files (hypothesis)
  Parameterized:      2 files
  Async Tests:        ~933 (68% of total)

Anti-Patterns:
  asyncio.sleep:      25 occurrences
  time.sleep:         6 occurrences
  Internal state:     ~10 occurrences
  Duplicate mocks:    5+ files with identical mock agents
```

---

*Report generated by QE Test Architect v3 -- 2026-03-23*
