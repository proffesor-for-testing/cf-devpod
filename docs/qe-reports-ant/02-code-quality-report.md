# Code Quality Review Report: lionagi-qe-fleet

**Date:** 2026-03-23
**Reviewer:** QE Code Reviewer (V3)
**Scope:** `/tmp/lionagi-qe-fleet/src/lionagi_qe/` -- all modules (~90 files, ~27,290 LOC)
**Quality Grade: B** (73/100)

---

## Executive Summary

The lionagi-qe-fleet project is a multi-agent quality engineering platform built on LionAGI with 18 specialized agents, Q-learning integration, multi-backend persistence, an artifact storage layer, and a FastAPI REST API. The architecture is ambitious and generally well-structured, with strong documentation, good separation of concerns, and thoughtful deprecation management.

However, the review identified **4 critical bugs** (runtime `AttributeError` from `self.memory_store` references), **6 high-severity issues** (security misconfigurations, deprecated API usage, dead code, interface inconsistencies), and **18 medium-severity findings** (DRY violations, missing error handling, type hint gaps, hardcoded values). The project would benefit most from fixing the critical attribute errors, tightening CORS and secret management, and consolidating the duplicated agent constructor boilerplate.

### Quality Score Breakdown

| Category | Score | Weight | Weighted |
|---|---|---|---|
| Architecture & Organization | 82/100 | 20% | 16.4 |
| Error Handling | 62/100 | 15% | 9.3 |
| Naming & Readability | 85/100 | 10% | 8.5 |
| DRY / Duplication | 55/100 | 10% | 5.5 |
| SOLID Adherence | 78/100 | 10% | 7.8 |
| Type Hint Coverage | 72/100 | 10% | 7.2 |
| Documentation | 88/100 | 10% | 8.8 |
| Security Practices | 55/100 | 10% | 5.5 |
| Logging & Observability | 80/100 | 5% | 4.0 |
| **Total** | | **100%** | **73.0** |

---

## 1. Architecture Assessment

### 1.1 Strengths

- **Clear layered architecture:** `core/` for framework primitives, `agents/` for domain specialization, `api/` for external interface, `storage/` for artifact backends, `learning/` for Q-learning, `persistence/` for memory backends. This is a clean, navigable structure.
- **Abstract base classes used well:** `BaseQEAgent` (core/base_agent.py) and `ArtifactStorage` (storage/backends/base.py) provide solid extension points via ABC.
- **Deprecation done right:** `QEFleet` and `QEMemory` in `__init__.py` issue `DeprecationWarning` with migration guides. The deprecated `fleet.py` module also provides a clear migration path. This is professional-grade backward compatibility management.
- **Configuration management:** `StorageConfig` (config/storage_config.py) with factory methods (`for_development()`, `for_testing()`, `for_production()`) and environment auto-detection is clean and production-ready.
- **WIP-limited orchestrator:** `orchestrator_wip.py` implements the Small Teams pattern with lane-based semaphore coordination, context budgeting, and self-tuning recommendations. This is a well-designed concurrency control layer.

### 1.2 Weaknesses

- **Two orchestrator classes with overlapping responsibility:** `QEOrchestrator` and `WIPLimitedOrchestrator` exist in separate files. The WIP orchestrator inherits from the base but redefines `execute_parallel` and `execute_agent`, creating a fragile override chain.
- **No formal interface/protocol for memory backends:** `QEMemory`, `PostgresMemory`, and `RedisMemory` all implement the same `store/retrieve/search/delete/list_keys/get_stats` interface but share no common ABC or Protocol. This is an Interface Segregation violation.
- **Agent modules tightly coupled to LionAGI internals:** Agents import `Branch`, `iModel`, `Session`, `Builder`, `ExpansionStrategy`, `Instruct`, etc. directly. A facade/adapter layer would improve testability and decouple from framework churn.

---

## 2. Module-by-Module Findings

### 2.1 core/base_agent.py (1,205 lines)

| Severity | Finding | Line(s) |
|---|---|---|
| MEDIUM | File at 1,205 lines exceeds reasonable single-file size. The Q-learning helper methods (_extract_state_from_task, _hash_state, _calculate_reward, _store_trajectory, _decay_epsilon, execute_with_learning, etc.) account for ~500 lines and should be extracted into a mixin or strategy class. | 486-931 |
| MEDIUM | `_get_timestamp()` imports `time` inside the method body. Module-level import preferred for clarity and performance. | 929 |
| LOW | `_get_available_actions()` returns hardcoded `["default_action", "alternative_action"]`. While documented as override point, a more meaningful default or an explicit `NotImplementedError` would be clearer. | 781 |
| LOW | `safe_operate` and `safe_parse_response` have nearly identical fuzzy-parsing fallback logic (~40 lines duplicated). Extract shared parsing logic into a private helper. | 1038-1100 vs 1101-1204 |

### 2.2 core/orchestrator.py (1,005 lines)

| Severity | Finding | Line(s) |
|---|---|---|
| MEDIUM | `execute_parallel` imports `asyncio` inside the method body (line 555), while `from lionagi.ln import alcall` (line 538) is imported but never used. Dead import. | 538, 555 |
| MEDIUM | `execute_conditional_workflow` default branch matching logic (lines 942-946) uses `decision_value in name` which will match substring membership in a string branch name. This is semantically fragile -- `"low"` would match branch name `"allow"`. | 944 |
| LOW | `execute_parallel_expansion` accesses `source_op.response.items` (line 737) which assumes LionAGI's Builder returns a response with an `.items` attribute. No guard or error message if this fails. | 737 |
| LOW | f-string logging used extensively (`f"Executing pipeline: {' -> '.join(pipeline)}"`) which evaluates even when log level would filter the message. For hot paths, use lazy logging: `logger.info("Executing pipeline: %s", ...)`. | Throughout |

### 2.3 core/fleet.py (578 lines) -- DEPRECATED

| Severity | Finding | Line(s) |
|---|---|---|
| LOW | Despite being deprecated, this file is 578 lines of pure delegation. Every method just calls `self.orchestrator.xyz()`. Since it is deprecated and slated for v2.0.0 removal, this is acceptable but still a maintenance burden. Consider whether it is needed given the `__init__.py` shim already handles deprecation. | 1-578 |

### 2.4 core/memory.py (162 lines)

| Severity | Finding | Line(s) |
|---|---|---|
| MEDIUM | `_is_expired()` compares `datetime.now().timestamp()` with stored timestamp, but TTL check uses `elapsed > data["ttl"]` with no handling for clock drift or negative elapsed values. | 141-147 |
| LOW | `search()` compiles a new regex on every call with no caching. For repeated searches with the same pattern, this is wasteful. | 95 |
| LOW | `import_state()` replaces `self._store` entirely, discarding any locks that might be held. This could cause race conditions during concurrent access. | 160-161 |

### 2.5 core/router.py (205 lines)

| Severity | Finding | Line(s) |
|---|---|---|
| MEDIUM | `route()` has mutable default argument: `context: Dict[str, Any] = None` should be `context: Optional[Dict[str, Any]] = None`. While it is corrected on line 151 (`context = context or {}`), the signature itself is technically a mutable-default anti-pattern that type checkers will flag. | 140 |
| LOW | Cost per 1K tokens (line 73-78) is hardcoded. Model pricing changes frequently. These should be configurable or loaded from a config file. | 73-78 |

### 2.6 core/hooks.py (591 lines)

| Severity | Finding | Line(s) |
|---|---|---|
| MEDIUM | `call_history` list grows unboundedly. In long-running production sessions with thousands of AI calls, this will consume significant memory. Should have a configurable max length with ring-buffer semantics. | 79, 181 |
| LOW | `dashboard_ascii()` has hardcoded column widths that may misalign with large numbers (e.g., session duration > 99999.9 seconds will break formatting). | 563-589 |
| LOW | `export_metrics` has unreachable code: the `else: raise ValueError(...)` on line 517 is dead because the format validation on line 470 already raises for invalid formats. | 516-517 |

### 2.7 core/orchestrator_wip.py (547 lines)

| Severity | Finding | Line(s) |
|---|---|---|
| LOW | Uses emoji characters in recommendation strings (lines 462, 469, 477, 484, 496). While fine for display, these should be constants and may cause encoding issues in some logging backends. | 462-496 |
| LOW | `AgentLane.acquire()` uses deprecated `asyncio.get_event_loop()` which will raise `DeprecationWarning` in Python 3.12+. Use `asyncio.get_running_loop()` instead. | 71-73 |

### 2.8 core/task.py (46 lines)

| Severity | Finding | Line(s) |
|---|---|---|
| MEDIUM | `task_id` default factory `f"task_{datetime.now().timestamp()}"` uses floating-point timestamps, which can produce collisions in high-throughput scenarios. Use `uuid.uuid4()` instead. | 11 |

---

### 2.9 agents/ (18 agent files)

#### CRITICAL: Attribute Error Bug in security_scanner.py and performance_tester.py

| Severity | Finding | File:Line |
|---|---|---|
| **CRITICAL** | `SecurityScannerAgent.execute()` references `self.memory_store.retrieve(...)` and `self.memory_store.store(...)` throughout, but `BaseQEAgent` has no `memory_store` attribute. The correct attribute is `self.memory`. This will cause `AttributeError` at runtime on every execution. | security_scanner.py:217,226,232,315,330,343 |
| **CRITICAL** | `PerformanceTesterAgent.execute()` has the same bug: references `self.memory_store` which does not exist. Should be `self.memory` or use the helper methods `self.get_memory()` / `self.store_memory()`. | performance_tester.py:190,196,250,265 |

Additionally, the `memory.retrieve(key, partition=...)` calls in these agents pass a `partition` keyword argument that `QEMemory.retrieve()` does not accept (it only takes `key`). This is a second-level bug that would surface even after fixing the attribute name.

#### Agent Constructor Boilerplate (DRY Violation)

All 18 agent files repeat nearly identical `__init__` signatures and docstrings:

```python
def __init__(
    self,
    agent_id: str,
    model: Any,
    memory: Optional[Any] = None,
    skills: Optional[List[str]] = None,
    enable_learning: bool = False,
    q_learning_service: Optional[Any] = None,
    memory_config: Optional[Dict[str, Any]] = None
):
```

Each agent's `__init__` is 15-25 lines that simply calls `super().__init__(...)` with a different default `skills` list. This is a **HIGH-severity DRY violation** across 18 files (270+ duplicated lines). The pattern can be eliminated by moving the skills default into a class-level constant and removing the explicit `__init__` from agents that add no additional logic.

**Recommendation:**
```python
class TestGeneratorAgent(BaseQEAgent):
    DEFAULT_SKILLS = ["agentic-quality-engineering", "api-testing-patterns", "tdd-london-chicago"]
    # No __init__ needed if BaseQEAgent handles skills default
```

#### coverage_analyzer.py Streaming Simulation

| Severity | Finding | File:Line |
|---|---|---|
| MEDIUM | `analyze_coverage_streaming()` contains `await asyncio.sleep(0.1)` (line 395) and synthetic gap generation (`if i % 3 == 0`) on lines 401-411. This is simulation code masquerading as real analysis. Should be clearly marked as stub/mock or removed. | coverage_analyzer.py:395,401-411 |
| MEDIUM | `execute()` calls `await self.post_execution_hook(task, result.model_dump())` explicitly (line 275), but the orchestrator already calls `post_execution_hook` in `execute_agent()`. This will cause **double invocation** of the hook. | coverage_analyzer.py:275 |

#### test_generator.py

| Severity | Finding | File:Line |
|---|---|---|
| LOW | `execute()` return type annotation says `GeneratedTest` but `execute_with_reasoning()` returns `Dict[str, Any]`. Inconsistent return types between the two execution paths makes API contract unclear. | test_generator.py:144 vs 482 |
| LOW | `_calculate_quality_improvement()` divides by `baseline_edge_cases` (value 2) and `baseline_scenarios` (value 3) without guarding against zero. If baselines were configurable this would be a division-by-zero risk. | test_generator.py:840-842 |

---

### 2.10 api/ Module

#### api/auth.py

| Severity | Finding | File:Line |
|---|---|---|
| **HIGH** | `SECRET_KEY = secrets.token_urlsafe(32)` is generated at module import time (line 34). This means every server restart generates a new secret, invalidating all existing JWT tokens. In production, this should be loaded from environment variables or a secrets manager. | auth.py:34 |
| **HIGH** | Default API key is generated and partially printed at module load time (lines 211-214). This runs on every import, including tests and CLI tools that import any `api` submodule. | auth.py:211-214 |
| MEDIUM | In-memory API key store `_api_keys: Dict[str, APIKey] = {}` (line 39) will lose all keys on restart. This is documented with a comment but has no production implementation. | auth.py:39 |
| MEDIUM | `decode_access_token()` uses `datetime.fromtimestamp()` which creates a timezone-naive datetime, while `datetime.utcnow()` is used elsewhere. Inconsistent timezone handling. | auth.py:131 |

#### api/server.py

| Severity | Finding | File:Line |
|---|---|---|
| **HIGH** | CORS is configured with `allow_origins=["*"]` (line 94). While documented with a "configure appropriately for production" comment, this is a security vulnerability. Production CORS should be restrictive. | server.py:94 |
| MEDIUM | Global exception handler (lines 107-129) exposes `str(request.url)` in error response details, which could leak internal URL structures. | server.py:123 |

#### api/rate_limit.py

| Severity | Finding | File:Line |
|---|---|---|
| MEDIUM | In-memory rate limiting (`_request_history` dict) does not scale across multiple server instances. No mention of Redis-based rate limiting for production. | rate_limit.py:33 |
| LOW | `_request_history` dict never evicts stale API keys, only stale timestamps within a key. Long-running servers will accumulate empty lists for defunct API keys. | rate_limit.py:33 |

#### api/models.py

| Severity | Finding | File:Line |
|---|---|---|
| LOW | `ErrorResponse.timestamp` uses `default_factory=datetime.utcnow` (line 269). `datetime.utcnow()` is deprecated in Python 3.12+; use `datetime.now(timezone.utc)` instead. | models.py:269 |

#### api/endpoints/ (7 endpoint files)

| Severity | Finding | Pattern |
|---|---|---|
| MEDIUM | All endpoint files catch `Exception as e` and raise `HTTPException(status_code=500, detail=str(e))`. This leaks internal error messages to API consumers. Should log internally and return generic error. | All 7 endpoint files |

---

### 2.11 learning/ Module

#### learning/qlearner.py (514 lines)

| Severity | Finding | File:Line |
|---|---|---|
| MEDIUM | `select_action()` interface expects `task_context: Dict[str, Any]` but `BaseQEAgent._learn_from_execution()` calls `self.q_service.update_q_value(agent_id=..., state_hash=..., ...)` with a completely different signature. The `QLearningService.update_q_value()` takes `state_before`, `action`, `reward`, `state_after`, `done` -- but `BaseQEAgent` calls it with named parameters like `agent_id`, `state_hash`, `action_id`, `next_state_hash`, `is_terminal`. **These interfaces are incompatible.** | qlearner.py:184 vs base_agent.py:572 |
| MEDIUM | `_sync_to_database()` syncs the entire Q-table on every sync cycle, including entries that have not changed. Should track dirty entries for incremental sync. | qlearner.py:287 |
| LOW | `load_from_database()` is a stub that logs "Q-table loaded" without actually loading anything. | qlearner.py:323-337 |

#### learning/state_encoder.py (296 lines)

| Severity | Finding | File:Line |
|---|---|---|
| LOW | `AGENT_TYPES` list is hardcoded (line 31-38). Adding a new agent type requires modifying this class, violating the Open/Closed Principle. Should discover agent types dynamically or use a registry. | state_encoder.py:31-38 |
| LOW | `_extract_features()` uses a long if/elif chain for agent type dispatch (lines 108-124). Strategy pattern with a registry dict would be cleaner. | state_encoder.py:108-124 |

#### learning/reward_calculator.py (353 lines)

Good implementation with well-documented multi-objective reward function. The agent-specific adjustments (`_test_generator_adjustment`, `_flaky_hunter_adjustment`, `_performance_tester_adjustment`) follow a clean extension pattern.

| Severity | Finding | File:Line |
|---|---|---|
| LOW | `calculate_agent_specific_reward()` uses if/elif chain for dispatch (lines 278-285). Same Strategy pattern recommendation as StateEncoder. | reward_calculator.py:278-285 |

#### learning/db_manager.py (488 lines)

| Severity | Finding | File:Line |
|---|---|---|
| MEDIUM | Multiple methods have the pattern `if self.pool is None: await self.connect()`. This auto-connect-on-first-use pattern is convenient but can mask configuration errors until runtime. A more explicit lifecycle (connect must be called before use) would be safer. | db_manager.py:85-87,125-126, etc. |
| LOW | `store_trajectory()` has 14 parameters. This is a Long Parameter List code smell. Consider using a TrajectoryData dataclass. | db_manager.py:217-233 |

---

### 2.12 persistence/ Module

#### persistence/redis_memory.py (437 lines)

| Severity | Finding | File:Line |
|---|---|---|
| MEDIUM | All methods are declared `async def` but use synchronous `self.client` Redis calls. The `redis` package's synchronous client blocks the event loop. Should use `redis.asyncio.Redis` for proper async support. | redis_memory.py:132-437 |
| LOW | `clear_partition()` performs a full key scan with `self.client.keys("*")` (line 285), which is O(N) and can block Redis for large datasets. Should use SCAN cursor instead. | redis_memory.py:285 |

#### persistence/postgres_memory.py (456 lines)

Clean implementation with proper namespace enforcement (`aqe/` prefix), SQL injection protection via parameterized queries, and efficient UPSERT operations. This is one of the strongest modules in the codebase.

| Severity | Finding | File:Line |
|---|---|---|
| LOW | `search()` converts glob patterns to SQL LIKE (line 220-221) but does not escape SQL LIKE special characters (`%`, `_`) that might appear in user-provided patterns. | postgres_memory.py:220-221 |

---

### 2.13 storage/ Module

Well-designed with proper factory pattern, abstract base class, and multiple backend implementations (local, S3, CI).

| Severity | Finding | File:Line |
|---|---|---|
| LOW | `StorageFactory.create_from_env()` imports `os` inside the method (line 88). Should be module-level. | storage/backends/factory.py:88 |

---

### 2.14 config/ Module

| Severity | Finding | File:Line |
|---|---|---|
| LOW | `StorageConfig._extract_host_from_url()` does naive string splitting. Should use `urllib.parse.urlparse()` for robust URL parsing. | config/storage_config.py:377-397 |

---

## 3. Code Smell Catalog

### CRITICAL (Must Fix)

| ID | Smell | Files | Impact |
|---|---|---|---|
| CS-001 | `self.memory_store` attribute does not exist; should be `self.memory` | security_scanner.py, performance_tester.py | Runtime `AttributeError` on every execution |
| CS-002 | `memory.retrieve(key, partition=...)` passes unsupported kwarg | security_scanner.py, performance_tester.py | Runtime `TypeError` |
| CS-003 | `QLearningService` interface mismatch with `BaseQEAgent._learn_from_execution()` | base_agent.py:572 vs qlearner.py:184 | Q-learning updates will fail |
| CS-004 | `CoverageAnalyzerAgent.execute()` double-invokes `post_execution_hook` | coverage_analyzer.py:275 | Metrics counted twice, results stored twice |

### HIGH (Should Fix Soon)

| ID | Smell | Files | Impact |
|---|---|---|---|
| CS-005 | JWT `SECRET_KEY` regenerated on every import | api/auth.py:34 | All tokens invalidated on restart |
| CS-006 | CORS `allow_origins=["*"]` | api/server.py:94 | Cross-origin security vulnerability |
| CS-007 | Default API key printed at import time | api/auth.py:211-214 | Side effects on import, security risk |
| CS-008 | Agent `__init__` boilerplate duplicated 18 times | All 18 agent files | 270+ lines of identical code |
| CS-009 | RedisMemory uses sync Redis client inside async methods | persistence/redis_memory.py | Event loop blocking |
| CS-010 | `datetime.utcnow()` used in 17 files (deprecated Python 3.12+) | Multiple files | Future deprecation warnings |

### MEDIUM (Should Address)

| ID | Smell | Files | Impact |
|---|---|---|---|
| CS-011 | `call_history` list grows unboundedly | core/hooks.py:79 | Memory leak in long sessions |
| CS-012 | API endpoints leak internal errors via `str(e)` | api/endpoints/*.py | Information disclosure |
| CS-013 | `task_id` collision risk (float timestamp) | core/task.py:11 | Duplicate task IDs |
| CS-014 | Dead import `from lionagi.ln import alcall` | core/orchestrator.py:538 | Code cleanliness |
| CS-015 | Coverage streaming uses simulation code | coverage_analyzer.py:395-411 | Misleading behavior |
| CS-016 | Mutable default arg `context: Dict = None` | core/router.py:140 | Type checker warnings |
| CS-017 | Hardcoded model pricing | core/router.py:73-78 | Stale pricing data |
| CS-018 | `_sync_to_database()` re-syncs entire Q-table | learning/qlearner.py:287 | Unnecessary DB writes |

### LOW (Nice to Have)

| ID | Smell | Files | Impact |
|---|---|---|---|
| CS-019 | `_extract_host_from_url` uses string splitting instead of urlparse | config/storage_config.py:389 | Edge case failures |
| CS-020 | `import time` inside method body | core/base_agent.py:929 | Style consistency |
| CS-021 | `AGENT_TYPES` hardcoded list violates OCP | learning/state_encoder.py:31 | Manual update required |
| CS-022 | No memory backend Protocol/ABC | persistence/ | No compile-time interface check |
| CS-023 | `load_from_database()` is a stub | learning/qlearner.py:323 | Feature incomplete |
| CS-024 | `clear_partition()` in RedisMemory does full `KEYS *` scan | persistence/redis_memory.py:285 | Redis blocking |
| CS-025 | Regex compiled on every `search()` call | core/memory.py:95 | Minor performance |
| CS-026 | `store_trajectory()` has 14 parameters | learning/db_manager.py:217 | Code readability |

---

## 4. Best Practices Compliance Checklist

| Practice | Status | Notes |
|---|---|---|
| **SOLID - Single Responsibility** | PARTIAL | `BaseQEAgent` handles communication, memory, metrics, AND Q-learning (1,205 lines). Extract Q-learning into mixin. |
| **SOLID - Open/Closed** | PARTIAL | Agent dispatch in `StateEncoder` and `RewardCalculator` uses if/elif chains instead of registry pattern. |
| **SOLID - Liskov Substitution** | PASS | All agents properly extend `BaseQEAgent`. |
| **SOLID - Interface Segregation** | FAIL | No shared ABC for memory backends (QEMemory, PostgresMemory, RedisMemory). |
| **SOLID - Dependency Inversion** | PARTIAL | Agents depend on concrete LionAGI classes. No adapter/facade layer. |
| **Clean Code - Meaningful Names** | PASS | Variables, methods, and classes have descriptive names throughout. |
| **Clean Code - Small Functions** | PARTIAL | Most functions are reasonable length. `execute_with_reasoning` was properly decomposed. Some methods in hooks.py are long. |
| **Clean Code - No Dead Code** | FAIL | Dead import in orchestrator.py. Stub in qlearner.py. Unreachable code in hooks.py. |
| **Defensive Programming** | PARTIAL | Good use of optional chaining and fallbacks. But `memory_store` bug shows gaps in attribute validation. |
| **Type Hints** | PARTIAL | Most public methods have type hints. Several `model: Any` and `memory: Optional[Any]` are too loose. |
| **Docstrings** | PASS | Excellent documentation quality. Module, class, and method docstrings with examples, args, returns, and usage patterns. |
| **Import Organization** | PARTIAL | Some in-method imports (asyncio, time, os). Standard library / third-party / local ordering is mostly followed. |
| **Logging** | PASS | Consistent use of `logging.getLogger()` with hierarchical names. Good log level selection. |
| **Configuration** | PASS | `StorageConfig` with env-var detection is well-designed. |
| **Error Handling** | PARTIAL | Good try/except patterns in core modules, but API endpoints expose internal errors. |
| **Test Coverage** | N/A | Not assessed (no test files in review scope). |

---

## 5. Actionable Recommendations (Prioritized by Impact)

### Priority 1: Critical Bugs (fix immediately)

**R-001: Fix `self.memory_store` references in SecurityScannerAgent and PerformanceTesterAgent**
- Files: `agents/security_scanner.py`, `agents/performance_tester.py`
- Action: Replace all `self.memory_store.retrieve(key, partition=...)` with `self.get_memory(key)` or `await self.memory.retrieve(key)`. Replace all `self.memory_store.store(key, value, partition=..., ttl=...)` with `await self.store_memory(key, value, ttl=...)` or `await self.memory.store(key, value, ttl=...)`.
- Impact: Prevents runtime crashes in 2 of 18 agents.

**R-002: Fix Q-learning interface mismatch between BaseQEAgent and QLearningService**
- Files: `core/base_agent.py`, `learning/qlearner.py`
- Action: Align the method signatures. `BaseQEAgent._learn_from_execution()` calls `self.q_service.update_q_value(agent_id=..., state_hash=..., action_id=..., reward=..., next_state_hash=..., is_terminal=...)` but `QLearningService.update_q_value()` expects `(state_before, action, reward, state_after, done)`. Either update the caller or the callee to match.
- Impact: Enables Q-learning to actually function.

**R-003: Remove double `post_execution_hook` call in CoverageAnalyzerAgent**
- File: `agents/coverage_analyzer.py:275`
- Action: Remove `await self.post_execution_hook(task, result.model_dump())` from `execute()`. The orchestrator's `execute_agent()` already calls this hook.
- Impact: Prevents double-counting of metrics and duplicated memory writes.

### Priority 2: Security Hardening (fix before production)

**R-004: Externalize JWT SECRET_KEY**
- File: `api/auth.py:34`
- Action: `SECRET_KEY = os.getenv("AQE_JWT_SECRET_KEY", secrets.token_urlsafe(32))` with a warning log when using the generated fallback.
- Impact: Tokens survive server restarts; secret is not regenerated.

**R-005: Restrict CORS origins**
- File: `api/server.py:94`
- Action: `allow_origins=os.getenv("AQE_CORS_ORIGINS", "http://localhost:3000").split(",")` with documentation for the env var.
- Impact: Prevents cross-origin attacks in production.

**R-006: Guard API key generation side effect**
- File: `api/auth.py:211-214`
- Action: Wrap in `if __name__ == "__main__"` or move to a CLI command. Do not generate API keys on import.
- Impact: Prevents side effects and potential key leakage.

**R-007: Sanitize error messages in API endpoints**
- Files: All `api/endpoints/*.py` files
- Action: Replace `raise HTTPException(status_code=500, detail=str(e))` with `logger.error(f"...: {e}", exc_info=True); raise HTTPException(status_code=500, detail="Internal server error")`.
- Impact: Prevents information disclosure.

### Priority 3: Code Quality (fix in next sprint)

**R-008: Eliminate agent constructor boilerplate**
- Files: All 18 `agents/*.py` files
- Action: Add `DEFAULT_SKILLS: ClassVar[List[str]] = []` to `BaseQEAgent`. In agent subclasses, remove `__init__` entirely and set `DEFAULT_SKILLS` as a class variable. Modify `BaseQEAgent.__init__` to use `self.__class__.DEFAULT_SKILLS` when `skills` is None.
- Impact: Removes ~270 lines of duplicated code.

**R-009: Create Memory Backend Protocol**
- File: New file `persistence/protocols.py`
- Action: Define `class MemoryBackend(Protocol)` with `async def store(...)`, `async def retrieve(...)`, `async def search(...)`, `async def delete(...)`, `async def list_keys(...)`, `async def get_stats(...)`. Have all backends conform to this protocol.
- Impact: Type-safe memory backend swapping; catches interface drift at type-check time.

**R-010: Use async Redis client**
- File: `persistence/redis_memory.py`
- Action: Replace `import redis` with `import redis.asyncio as redis`. Update `self.client = redis.Redis(connection_pool=self.pool)` to use async client. Replace all `self.client.get/set/keys/...` with `await self.client.get/set/keys/...`.
- Impact: Prevents event loop blocking in async applications.

**R-011: Fix `datetime.utcnow()` deprecation**
- Files: 17 files
- Action: Replace `datetime.utcnow()` with `datetime.now(timezone.utc)` throughout. Add `from datetime import timezone` where needed.
- Impact: Python 3.12+ compatibility.

**R-012: Use UUID for task IDs**
- File: `core/task.py:11`
- Action: `task_id: str = Field(default_factory=lambda: str(uuid.uuid4()))`.
- Impact: Eliminates collision risk.

### Priority 4: Cleanup (address when touching files)

**R-013: Remove dead import `alcall`** -- `core/orchestrator.py:538`
**R-014: Move in-method imports to module level** -- `core/base_agent.py:929`, `storage/backends/factory.py:88`
**R-015: Cap `call_history` list length** -- `core/hooks.py:79`
**R-016: Implement `load_from_database()`** -- `learning/qlearner.py:323`
**R-017: Use `urllib.parse.urlparse()` for URL parsing** -- `config/storage_config.py:389`
**R-018: Add dirty-tracking to Q-table sync** -- `learning/qlearner.py:287`

---

## 6. Summary Metrics

| Metric | Value |
|---|---|
| Files Reviewed | ~90 |
| Lines of Code | 27,290 |
| Critical Findings | 4 |
| High Findings | 6 |
| Medium Findings | 18 |
| Low Findings | 14 |
| Total Findings | 42 |
| Weighted Finding Score | 3 * 4 + 2 * 6 + 1 * 18 + 0.5 * 14 = 12 + 12 + 18 + 7 = **49.0** |
| Quality Grade | **B** (73/100) |
| Recommendation | **CONDITIONAL APPROVAL** -- Fix critical bugs (R-001 through R-003) and security issues (R-004 through R-007) before any production deployment. |

---

*Report generated by QE Code Reviewer v3 -- quality-assessment domain*
*Review duration: comprehensive multi-pass analysis*
*Files with no findings: ~55 files (agents with only boilerplate issues, storage/utils, badges, mcp, workers, tracking, tools, cli modules)*
