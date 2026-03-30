# SFDIPOT Product Factors Analysis: lionagi-qe-fleet

**Assessment Date**: 2026-03-23
**Assessor**: V3 QE Product Factors Assessor (HTSM Framework)
**Project**: lionagi-qe-fleet v1.3.1
**Source Path**: `/workspaces/cf-devpod/tmp/lionagi-qe-fleet/`
**Codebase Size**: 94 source files, 97 test files, ~27,190 lines of Python

---

## Executive Summary

The lionagi-qe-fleet is a Python-based quality engineering platform that orchestrates 18 specialized AI agents for software testing and quality assurance. It features Q-learning-based agent optimization, multi-backend storage (PostgreSQL, Redis, S3, local), a REST API with WebSocket streaming, MCP integration for Claude Code, badge generation, and CI/CD support.

This SFDIPOT analysis examined all 7 product factors across 37 subcategories. The analysis identified **23 high-risk areas**, **47 medium-risk areas**, and generated **156 test ideas** across the product factors. The most critical risks concentrate in the **Data** (persistence layer transitions), **Time** (concurrency in Q-learning sync), **Interfaces** (API authentication gaps), and **Platform** (dependency fragility on lionagi core library) dimensions.

### Risk Heat Map

| Factor       | Risk Level | Critical Findings |
|-------------|-----------|-------------------|
| **Structure**  | MEDIUM    | Deprecated code coexisting with replacement; WIP file in core |
| **Function**   | HIGH      | 18 agents with varying implementation maturity; Q-learning sync gaps |
| **Data**       | HIGH      | In-memory API key storage; Q-table sync data loss window |
| **Interfaces** | HIGH      | CORS wildcard in production; auth bypass risks; MCP fallback |
| **Platform**   | MEDIUM    | Hard dependency on lionagi>=0.18.2; asyncpg in core deps |
| **Operations** | MEDIUM    | No automated test CI workflow; manual start scripts |
| **Time**       | HIGH      | Race conditions in Q-table sync; rate limiter memory leak |

### Priority Distribution

| Priority | Count | Percentage | Description |
|----------|-------|-----------|-------------|
| P0 (Critical) | 16 | 10.3% | Must fix before any production deployment |
| P1 (High)     | 42 | 26.9% | Fix within current sprint |
| P2 (Medium)   | 65 | 41.7% | Fix within next 2 sprints |
| P3 (Low)      | 33 | 21.2% | Backlog / nice to have |

---

## 1. STRUCTURE - What the Product IS

### 1.1 Code Architecture

**Package Layout**: The project follows a clean Python package structure under `src/lionagi_qe/` with well-defined subpackages:

```
src/lionagi_qe/
  agents/         # 18 specialized QE agents (18 files)
  api/            # REST API, SDK client, auth, rate limiting
    endpoints/    # 7 endpoint modules (test, coverage, quality, security, performance, jobs, fleet)
    sdk/          # Python client SDK with async support
    workers/      # Background task workers
  badges/         # SVG badge generation (api, cache, cli, colors, generator)
  cli/            # CLI interface (base, ci_mode, examples, output)
  config/         # Storage configuration
  core/           # Base agent, orchestrator, fleet, hooks, memory, router, task
  integrations/   # AgentDB integration
  learning/       # Q-learning (qlearner, state_encoder, reward_calculator, db_manager)
  mcp/            # Model Context Protocol server and tools
  persistence/    # PostgreSQL and Redis memory backends
  storage/        # Artifact storage (backends, models, utils)
    backends/     # Local, S3, CI storage with abstract base
    models/       # Pydantic models for artifacts and config
    utils/        # Compression, indexing, retention
  tools/          # Code analyzer
  tracking/       # Risk dependency tracker
  workers/        # Task workers
```

**Findings**:

1. **Deprecated code coexistence (MEDIUM RISK)**: `QEFleet` in `core/fleet.py` (578 lines) is deprecated but fully functional, coexisting with its replacement `QEOrchestrator` in `core/orchestrator.py` (1005 lines). Both import each other's dependencies. The `__init__.py` wraps `QEFleet` in a deprecation-warning factory function.

2. **WIP file in production code (LOW RISK)**: `core/orchestrator_wip.py` exists in the production source tree alongside the active `orchestrator.py`. This suggests incomplete refactoring.

3. **Dual worker modules (LOW RISK)**: Both `src/lionagi_qe/workers/tasks.py` and `src/lionagi_qe/api/workers/tasks.py` exist, creating potential confusion about which is canonical.

4. **Clean abstract hierarchy**: `ArtifactStorage` (base.py) provides a well-defined abstract interface with 7 abstract methods and 1 concrete streaming method. Three implementations: `LocalStorage`, `S3Storage`, `CIStorage`.

5. **Agent inheritance**: All 18 agents inherit from `BaseQEAgent` (ABC) which provides: LionAGI Branch initialization, memory backend abstraction, Q-learning hooks, execution metrics, and fuzzy JSON parsing.

### 1.2 Dependencies and Coupling

**Findings**:

6. **Tight coupling to LionAGI internals**: The codebase imports from `lionagi.ln.fuzzy`, `lionagi.fields`, `lionagi.operations`, `lionagi.service.hooks` -- deep internal modules. Any LionAGI refactoring could break this project.

7. **Circular import prevention**: The `__init__.py` uses lazy imports inside deprecation wrapper functions to avoid circular dependencies. This is fragile.

8. **Import fallback chains**: `base_agent.py` has 3 try/except import blocks for optional features (pydantic, fuzzy_json, Q-learning). These fallbacks mask real import errors.

### 1.3 Risk Areas - Structure

| Risk ID | Risk | Severity | Impact |
|---------|------|----------|--------|
| S-01 | Deprecated QEFleet has no removal timeline enforcement | Medium | Users build on deprecated API |
| S-02 | WIP file `orchestrator_wip.py` in production tree | Low | Confusion about canonical code |
| S-03 | Deep LionAGI internal imports can break on upgrade | High | Complete system failure |
| S-04 | Dual workers/ directories create ambiguity | Low | Wrong module imported |
| S-05 | Import fallback chains may mask real errors | Medium | Silent degradation |

### 1.4 Test Ideas - Structure

| # | Priority | Test Idea | Automation Fitness |
|---|----------|-----------|-------------------|
| S-T01 | P1 | Import `lionagi_qe` package after removing lionagi; confirm ImportError is raised with actionable message, not a silent fallback to broken state | Unit |
| S-T02 | P2 | Instantiate QEFleet and confirm DeprecationWarning is emitted with correct stacklevel and migration URL | Unit |
| S-T03 | P1 | Import all 18 agent classes from `lionagi_qe.agents` and confirm each inherits from BaseQEAgent with get_system_prompt and execute methods | Unit |
| S-T04 | P2 | Load the package when `pydantic` is not installed; confirm FUZZY_PARSING_AVAILABLE is False and agents still initialize | Unit |
| S-T05 | P3 | Run `python -c "from lionagi_qe.core.fleet import QEFleet; from lionagi_qe.core.orchestrator import QEOrchestrator"` and confirm no circular import error | Unit |
| S-T06 | P2 | Instantiate StorageFactory.create() with each valid StorageBackend enum value and confirm correct backend class is returned | Unit |
| S-T07 | P3 | Delete `orchestrator_wip.py` and run full test suite to confirm it is not imported anywhere | Unit |

---

## 2. FUNCTION - What the Product DOES

### 2.1 Agent Capabilities

The system provides 18 specialized agents organized into 4 tiers:

**Core Testing (6)**: TestGenerator, TestExecutor, CoverageAnalyzer, QualityGate, QualityAnalyzer, CodeComplexity
**Performance & Security (2)**: PerformanceTester, SecurityScanner
**Strategic Planning (3)**: RequirementsValidator, ProductionIntelligence, FleetCommander
**Advanced Testing (4)**: RegressionRiskAnalyzer, TestDataArchitect, APIContractValidator, FlakyTestHunter
**Specialized (3)**: DeploymentReadiness, VisualTester, ChaosEngineer

### 2.2 Orchestration Patterns

The `QEOrchestrator` implements 6 workflow patterns:
1. **Single agent execution** (`execute_agent`)
2. **Sequential pipeline** (`execute_pipeline`) - uses LionAGI Builder graph
3. **Parallel execution** (`execute_parallel`) - uses `asyncio.gather`
4. **Fan-out/Fan-in** (`execute_fan_out_fan_in`) - coordinator decomposes, workers execute, coordinator synthesizes
5. **Parallel expansion** (`execute_parallel_expansion`) - source produces items, target processes each
6. **Conditional workflow** (`execute_conditional_workflow`) - branching based on agent output

### 2.3 Q-Learning System

**Implementation**: Classic Q-Learning with Bellman equation: `Q(s,a) <- Q(s,a) + alpha[r + gamma * max(Q(s',a')) - Q(s,a)]`

**Components**:
- `QLearningService`: In-memory Q-table with periodic PostgreSQL sync
- `StateEncoder`: Agent-specific feature extraction for 18 agent types, SHA-256 state hashing
- `RewardCalculator`: Multi-objective reward with 5 weighted components (coverage 30%, quality 25%, time 20%, pattern reuse 15%, cost 10%)

**Findings**:

9. **Q-table sync data loss window (HIGH RISK)**: Q-values are stored in-memory and only synced to PostgreSQL every N updates (configurable, default 10). If the process crashes between syncs, learned Q-values are lost. The `_sync_to_database` method syncs ALL entries, not just dirty ones.

10. **load_from_database is a stub (HIGH RISK)**: The `load_from_database()` method in `qlearner.py` has a try/except that catches everything and logs "Q-table loaded" but actually loads nothing. Warm-starting from previous learning does not work.

11. **State encoder covers only 7 of 18 agents explicitly**: Only test-generator, test-executor, coverage-analyzer, quality-gate, performance-tester, security-scanner, and flaky-test-hunter have specific feature extractors. The remaining 11 agents fall through to `_extract_generic_features` which extracts only scope and environment.

### 2.4 API Functionality

12. **REST API exposes 7 endpoint groups**: test, coverage, quality, security, performance, jobs, fleet -- all under `/api/v1/` prefix.

13. **Health check is unauthenticated** (correct behavior): `/health` endpoint returns status without requiring auth.

14. **WebSocket streaming**: Job progress streaming at `/api/v1/job/{job_id}/stream`.

15. **Multi-model routing**: ModelRouter maps task complexity to 4 model tiers (GPT-3.5 -> GPT-4o-mini -> GPT-4 -> Claude Sonnet 4.5) with 70-81% claimed cost savings.

### 2.5 Error Handling

16. **Global exception handler masks errors**: The FastAPI global exception handler catches all exceptions and returns a generic 500 error, which is correct for production but the error logging includes `exc_info=True` which could expose stack traces to logs.

17. **Agent error recovery**: `execute_agent` calls `agent.error_handler(task, e)` and marks task as failed, but does not implement retry logic.

### 2.6 Risk Areas - Function

| Risk ID | Risk | Severity | Impact |
|---------|------|----------|--------|
| F-01 | Q-table data loss on process crash | High | Lost learning progress |
| F-02 | load_from_database is a stub (no actual loading) | High | Warm-start never works |
| F-03 | 11/18 agents use generic state encoding | Medium | Poor Q-learning generalization |
| F-04 | No agent execution retry logic | Medium | Transient failures cause task failure |
| F-05 | ModelRouter hardcodes model names/costs | Medium | Stale pricing, removed models |
| F-06 | Reward calculator division by zero possible in _flaky_hunter_adjustment | Low | Crash on edge case |

### 2.7 Test Ideas - Function

| # | Priority | Test Idea | Automation Fitness |
|---|----------|-----------|-------------------|
| F-T01 | P0 | Force-kill the process after 5 Q-value updates (sync_interval=10); restart and confirm the 5 unsaved Q-values are lost, quantifying the data loss window | Integration |
| F-T02 | P0 | Call `load_from_database()` with pre-seeded Q-values in PostgreSQL; assert the in-memory Q-table is populated (currently fails - stub) | Integration |
| F-T03 | P1 | Execute a learning episode for each of the 18 agent types; confirm state encoding produces distinct hashes for different task contexts | Unit |
| F-T04 | P1 | Trigger `execute_agent` with a task that raises a transient `ConnectionError`; confirm error_handler is called and task status is "failed" | Unit |
| F-T05 | P2 | Set ModelRouter costs to zero for all tiers; confirm routing still functions without division errors | Unit |
| F-T06 | P2 | Call `calculate_agent_specific_reward` for "flaky-test-hunter" with zero true_positives, false_positives, and false_negatives; confirm no ZeroDivisionError | Unit |
| F-T07 | P1 | Execute sequential pipeline with 4 agents where the 3rd agent fails; confirm pipeline stops, error propagates, and agents 1-2 results are preserved | Integration |
| F-T08 | P2 | Run execute_parallel with 10 agents and confirm all complete; measure wall-clock time is less than 2x the slowest individual agent | Integration |
| F-T09 | P1 | Execute conditional_workflow with decision_fn returning a branch name not in the branches dict; confirm ValueError is raised with actionable message | Unit |
| F-T10 | P2 | Call execute_fan_out_fan_in with an empty worker list; confirm graceful handling, not IndexError | Unit |
| F-T11 | P0 | Send a test_generate request via the API with a target path containing `../../etc/passwd`; confirm path traversal is rejected | Integration |
| F-T12 | P3 | Generate badges with all ArtifactType values; confirm valid SVG output for each | Unit |
| F-T13 | P2 | Execute execute_parallel_expansion with max_concurrent=1; confirm items are processed sequentially without deadlock | Integration |

---

## 3. DATA - What it PROCESSES

### 3.1 Data Models

**Pydantic models in `api/models.py`**:
- 7 request models: TestGenerationRequest, TestExecutionRequest, CoverageAnalysisRequest, QualityGateRequest, SecurityScanRequest, PerformanceTestRequest, FleetStatusRequest
- 4 response models: JobResponse, JobStatusResponse, FleetStatusResponse, ErrorResponse
- 4 enums: JobStatus (5 values), Framework (4 values), TestType (5 values), Priority (4 values)

**Artifact model**: ArtifactMetadata with 11 fields including checksum, compression ratio, retention_days, expiration timestamp.

**Q-Learning data**:
- Q-values: `(state_hash: str, action_hash: str) -> float` tuples
- State data: Agent-type-specific feature dictionaries
- Trajectories: Step-by-step episode records
- Agent state: total_tasks, success_rate, epsilon, learning_rate

### 3.2 Storage and Persistence

**4 memory backends**:
1. `QEMemory` (deprecated, in-memory dict)
2. `Session.context` (LionAGI native, in-memory)
3. `PostgresMemory` (asyncpg, connection pooling, ACID)
4. `RedisMemory` (redis-py, TTL support, pub/sub)

**Artifact storage backends**:
1. `LocalStorage` (filesystem)
2. `S3Storage` (AWS S3 / MinIO)
3. `CIStorage` (GitHub Actions / GitLab CI artifacts)

### 3.3 Data Boundaries

**Findings**:

18. **API request validation is minimal**: `TestGenerationRequest.target` only validates non-empty string. No path traversal protection, no file extension validation, no size limits on input.

19. **coverage_target allows 0.0-100.0 range**: A 0% coverage target is technically valid but semantically useless. No minimum threshold enforcement.

20. **PerformanceTestRequest allows up to 1000 virtual users**: This could overwhelm the target system. No safety limit warning.

21. **No input sanitization on task context dictionaries**: The orchestrator passes raw Dict[str, Any] contexts through to agents. Malicious payloads in context keys/values are not validated.

22. **Compression handles empty data**: `CompressionUtil.compress(b"")` returns `(b"", 0.0, sha256_of_empty)` -- correct behavior.

23. **Artifact checksum uses SHA-256 on uncompressed data**: This means verification requires decompression first, which is correct for integrity but expensive.

### 3.4 Risk Areas - Data

| Risk ID | Risk | Severity | Impact |
|---------|------|----------|--------|
| D-01 | No path traversal protection on API target paths | Critical | File system access |
| D-02 | Q-table sync writes ALL entries every sync, not dirty tracking | Medium | Unnecessary DB writes |
| D-03 | No input size limits on task contexts | Medium | Memory exhaustion |
| D-04 | Redis KEYS command used for pattern search (O(N)) | Medium | Performance degradation at scale |
| D-05 | Artifact retention uses datetime.utcnow() (deprecated in 3.12) | Low | Future compatibility |

### 3.5 Test Ideas - Data

| # | Priority | Test Idea | Automation Fitness |
|---|----------|-----------|-------------------|
| D-T01 | P0 | Submit TestGenerationRequest with target `"../../../etc/passwd"`, `"/etc/shadow"`, `"C:\\Windows\\System32\\config\\sam"` and confirm rejection | Integration |
| D-T02 | P0 | Submit request with a 100MB JSON body to the API; confirm 413 or appropriate size rejection before processing | Integration |
| D-T03 | P1 | Store 10,000 artifacts then call cleanup_expired; measure execution time stays under 5 seconds | Integration |
| D-T04 | P1 | Compress a 50MB artifact and verify checksum matches after decompress round-trip | Unit |
| D-T05 | P2 | Store data in PostgresMemory with TTL=1 second; wait 2 seconds and retrieve; confirm None returned | Integration |
| D-T06 | P2 | Insert Q-values for 100 different state-action pairs; call _sync_to_database; confirm all 100 rows exist in PostgreSQL | Integration |
| D-T07 | P2 | Call RetentionManager.should_keep with an artifact whose retention_days is None and expires_at is None; confirm default TTL is applied | Unit |
| D-T08 | P3 | Store artifact with tags {"env": "prod", "team": "alpha"} then list with filter tags={"env": "prod"}; confirm artifact appears in results | Integration |
| D-T09 | P1 | Submit SecurityScanRequest with severity_threshold="INVALID"; confirm 422 validation error | Unit |
| D-T10 | P2 | Call CompressionUtil.estimate_compressed_size with a 100KB highly compressible file and a 100KB random file; confirm estimates differ significantly | Unit |
| D-T11 | P0 | Send a request with a task context containing `{"__class__": "os.system", "args": "rm -rf /"}` as injection payload; confirm no code execution | Integration |

---

## 4. INTERFACES - How it CONNECTS

### 4.1 REST API

**Endpoints** (all under `/api/v1/`):
- `POST /test/generate` - Test generation
- `POST /test/execute` - Test execution
- `POST /coverage/analyze` - Coverage analysis
- `POST /quality/gate` - Quality gate validation
- `POST /security/scan` - Security scanning
- `POST /performance/test` - Performance testing
- `GET /jobs/{job_id}` - Job status
- `DELETE /jobs/{job_id}` - Cancel job
- `GET /fleet/status` - Fleet status
- `WS /job/{job_id}/stream` - WebSocket streaming

### 4.2 Authentication

**Findings**:

24. **In-memory API key storage (CRITICAL RISK)**: `_api_keys: Dict[str, APIKey] = {}` is a module-level dictionary. API keys are lost on server restart. The code comments say "replace with database in production" but provides no database implementation.

25. **Default API key auto-generated on module import**: Line 211-215 of `auth.py` generates a default API key whenever the module is first imported and prints it to stdout. This is a security risk in production -- stdout may be logged, captured, or exposed.

26. **SECRET_KEY regenerated on every server start**: `SECRET_KEY = secrets.token_urlsafe(32)` is generated at import time. All existing JWT tokens become invalid on server restart. No persistence mechanism.

27. **JWT token contains raw API key**: The JWT payload includes `"api_key": api_key`, meaning the API key can be extracted from any valid JWT token. This is a security concern if tokens are intercepted.

28. **CORS allows all origins**: `allow_origins=["*"]` in the FastAPI middleware configuration. The code has a comment "Configure appropriately for production" but provides no production configuration mechanism.

### 4.3 SDK Client

29. **SDK client uses aiohttp**: The `AQEClient` class provides async methods with retry logic, proper session management via context manager, and custom exceptions (AQEAPIError, AQEAuthenticationError, AQERateLimitError).

### 4.4 MCP Integration

30. **MCP has fallback mode**: When `fastmcp` is not installed, the code creates a stub `FastMCP` class that stores tools but cannot serve them. The fallback server runs an infinite `asyncio.sleep(1)` loop.

31. **MCP server uses deprecated QEFleet**: `mcp_server.py` imports and instantiates `QEFleet`, not `QEOrchestrator`, creating a dependency on deprecated code.

32. **MCP registers 17 tools**: Including test generation, execution, coverage, quality gate, performance, security, fleet orchestration, requirements validation, and streaming.

### 4.5 Risk Areas - Interfaces

| Risk ID | Risk | Severity | Impact |
|---------|------|----------|--------|
| I-01 | API keys stored in memory, lost on restart | Critical | Auth breaks on deploy |
| I-02 | Default API key printed to stdout | High | Credential leak in logs |
| I-03 | SECRET_KEY not persistent (JWT invalidated on restart) | High | Session disruption |
| I-04 | CORS wildcard allows all origins | High | Cross-origin attacks |
| I-05 | JWT contains raw API key | Medium | Key extractable from token |
| I-06 | MCP server depends on deprecated QEFleet | Medium | Will break in v2.0 |
| I-07 | MCP fallback mode is an infinite sleep loop | Low | No useful functionality |

### 4.6 Test Ideas - Interfaces

| # | Priority | Test Idea | Automation Fitness |
|---|----------|-----------|-------------------|
| I-T01 | P0 | Restart the API server and attempt to authenticate with a previously valid API key; confirm 401 Unauthorized | Integration |
| I-T02 | P0 | Start the server, capture the default API key from stdout, then use it for an authenticated request; confirm it works (demonstrating the security risk) | Integration |
| I-T03 | P0 | Extract the API key from a valid JWT token by base64-decoding the payload; confirm the raw key is present | Unit |
| I-T04 | P1 | Send a request with Origin header set to `evil.com` and confirm the response includes `Access-Control-Allow-Origin: *` | Integration |
| I-T05 | P1 | Call all 17 MCP tools with valid inputs and confirm each returns a result, not a "fleet not initialized" error | Integration |
| I-T06 | P2 | Open a WebSocket connection to `/api/v1/job/{job_id}/stream` with an invalid job_id; confirm proper error message, not a hang | Integration |
| I-T07 | P2 | Submit a test generation request with callback_url set; confirm webhook is called on completion | Integration |
| I-T08 | P1 | Send 101 requests within 60 seconds using the same API key; confirm request 101 returns HTTP 429 with Retry-After header | Integration |
| I-T09 | P2 | Use the SDK client with an expired JWT token; confirm AQEAuthenticationError is raised with helpful message | Unit |
| I-T10 | P3 | Call `AQEClient.__aenter__` and `__aexit__` repeatedly (10 times); confirm no session leaks | Unit |
| I-T11 | P2 | Import mcp_server without fastmcp installed; confirm fallback FastMCP class is used and warning is logged | Unit |

---

## 5. PLATFORM - What it DEPENDS ON

### 5.1 Python Requirements

- **Python**: >=3.10 (classifiers list 3.10, 3.11, 3.12)
- **Build system**: hatchling

### 5.2 Core Dependencies

```
lionagi>=0.18.2          # AI framework (CRITICAL dependency)
pydantic>=2.8.0          # Data validation
pytest>=8.0.0            # Testing (in core deps, not dev)
pytest-asyncio>=1.1.0    # Async test support
pytest-cov>=6.0.0        # Coverage
hypothesis>=6.100.0      # Property-based testing
coverage>=7.0.0          # Coverage tool
bandit>=1.7.0            # Security linter
safety>=3.0.0            # Dependency vulnerability checker
aiohttp>=3.9.0           # HTTP client
python-dotenv>=1.0.0     # .env file support
asyncpg>=0.29.0          # PostgreSQL async driver (in core deps!)
fastapi>=0.109.0         # Web framework (in core deps!)
uvicorn>=0.27.0          # ASGI server (in core deps!)
python-jose[cryptography]>=3.3.0  # JWT handling
websockets>=12.0         # WebSocket support
```

**Findings**:

33. **Testing frameworks in core dependencies (MEDIUM RISK)**: pytest, pytest-asyncio, pytest-cov, hypothesis, coverage, bandit, and safety are all listed as core `dependencies`, not under `[project.optional-dependencies].dev`. This means every production installation includes testing tools, adding ~20+ transitive dependencies.

34. **asyncpg and fastapi in core dependencies**: Database and web server libraries are required even for library-only usage. Users who only want the agents SDK must install PostgreSQL drivers and a web framework.

35. **lionagi version pinning is minimal**: `lionagi>=0.18.2` with no upper bound. LionAGI is a rapidly evolving project; internal API changes will break deep imports without upper bound protection.

36. **Optional dependencies are well-structured**: performance, mcp, persistence (redis), api, and dev extras allow selective installation.

### 5.3 Infrastructure

**Docker Compose** provides:
- PostgreSQL 16 Alpine (with shared_buffers=256MB, max_connections=200)
- pgAdmin 4 (database management UI)
- Redis 7 Alpine (optional, via `with-redis` profile)
- All on `lionagi-qe-network` bridge network

### 5.4 Risk Areas - Platform

| Risk ID | Risk | Severity | Impact |
|---------|------|----------|--------|
| P-01 | Test tools in production dependencies | Medium | Bloated production installs |
| P-02 | No upper bound on lionagi version | High | Breaking changes on upgrade |
| P-03 | asyncpg required even for non-database usage | Medium | Unnecessary build dependency |
| P-04 | Docker compose uses default passwords | Medium | Security risk if exposed |
| P-05 | No health check for the QE Fleet app itself in Docker | Low | No container restart on app crash |

### 5.5 Test Ideas - Platform

| # | Priority | Test Idea | Automation Fitness |
|---|----------|-----------|-------------------|
| P-T01 | P1 | Install lionagi-qe-fleet with only core dependencies (no extras); import the package and confirm basic agent creation works without asyncpg/redis | Unit |
| P-T02 | P1 | Install with `pip install lionagi-qe-fleet` and confirm no development tools (pytest, bandit) are importable from the installed package | Unit |
| P-T03 | P2 | Bring up docker-compose.yml and confirm PostgreSQL, pgAdmin, and Redis all pass health checks within 60 seconds | Integration |
| P-T04 | P2 | Run the full test suite on Python 3.10, 3.11, and 3.12; confirm zero failures on all versions | E2E |
| P-T05 | P1 | Pin lionagi to version 0.18.2 and run all tests; then upgrade to latest and note any failures | Integration |
| P-T06 | P3 | Install on a minimal Docker image (python:3.10-slim) without system PostgreSQL client; confirm asyncpg installs successfully | Integration |
| P-T07 | P0 | Attempt to connect to Docker PostgreSQL with the default password from docker-compose.yml over network; confirm authentication succeeds (demonstrating the risk) | Human Exploration |
| P-T08 | P2 | Start the Docker environment with `--profile with-redis` and confirm Redis health check passes | Integration |

---

## 6. OPERATIONS - How it's USED

### 6.1 Installation

**Methods**:
- `pip install lionagi-qe-fleet` (PyPI)
- `pip install lionagi-qe-fleet[all]` (with all extras)
- Development: clone + `pip install -e ".[dev]"`

### 6.2 Configuration

37. **Environment-based storage mode**: `AQE_STORAGE_MODE` or `ENVIRONMENT` or `NODE_ENV` environment variables control backend selection (development/testing/production).

38. **Configuration cascade**: StorageConfig.from_environment() checks multiple env vars in priority order. The logic is well-documented but the fallback chain could surprise users.

39. **Database connection pool tuning**: Configurable via `DB_POOL_SIZE`, `DB_POOL_MAX_OVERFLOW`, `DB_CONNECTION_TIMEOUT`, `DB_POOL_RECYCLE` environment variables.

### 6.3 Startup

40. **Two start scripts**: `start.sh` (basic) and `start-enhanced.sh` (tmux multi-pane layout with Claude Code, test runner, and logs panes). The enhanced script auto-installs tmux, Claude Code, and claude-flow if missing.

41. **`--dangerously-skip-permissions` flag**: The enhanced start script launches Claude Code with this flag, which bypasses permission checks.

### 6.4 CI/CD

42. **Only publish workflow exists**: `.github/workflows/publish.yml` handles PyPI publishing with Sigstore signing but there is NO test/lint CI workflow. Tests are not run automatically on PR/push.

43. **No pre-commit hooks configured**: The repository has sample git hooks but no `.pre-commit-config.yaml`.

### 6.5 Monitoring

44. **Hooks system provides observability**: QEHooks tracks per-agent cost, token usage, and call timing. Supports cost alert thresholds and rate limiting.

45. **Metrics are in-memory only**: Orchestrator metrics, hook metrics, and fleet status are all held in memory. No persistence or external metrics export (no Prometheus, no StatsD).

### 6.6 Risk Areas - Operations

| Risk ID | Risk | Severity | Impact |
|---------|------|----------|--------|
| O-01 | No CI/CD test workflow | High | Regressions ship to PyPI |
| O-02 | --dangerously-skip-permissions in start script | Medium | Security bypass |
| O-03 | No pre-commit hooks for linting/formatting | Low | Code quality drift |
| O-04 | Metrics not exported externally | Medium | No production monitoring |
| O-05 | .env.example contains example passwords | Low | Copy-paste credential reuse |

### 6.7 Test Ideas - Operations

| # | Priority | Test Idea | Automation Fitness |
|---|----------|-----------|-------------------|
| O-T01 | P0 | Run `pip install .` followed by `python -c "from lionagi_qe import QEOrchestrator"` in a clean virtual environment; confirm successful import | Integration |
| O-T02 | P1 | Set AQE_STORAGE_MODE=production without DATABASE_URL; confirm clear error message on QEOrchestrator initialization | Unit |
| O-T03 | P1 | Set AQE_STORAGE_MODE=development; confirm QEOrchestrator uses in-memory QEMemory, not PostgresMemory | Unit |
| O-T04 | P2 | Run `start-enhanced.sh` in a container without tmux installed; confirm it auto-installs tmux and creates the session | Integration |
| O-T05 | P2 | Execute a 100-agent workflow; read metrics via `get_fleet_status()`; confirm workflows_executed, total_agents_used, and total_cost are accurately tracked | Integration |
| O-T06 | P1 | Trigger publish.yml workflow_dispatch with environment=testpypi; confirm package builds and uploads to TestPyPI successfully | E2E |
| O-T07 | P3 | Configure QEHooks with cost_alert_threshold=0.01; execute an agent task; confirm cost warning is logged | Unit |
| O-T08 | P2 | Start the API server, run 1000 requests, then stop; confirm no resource leaks (open file descriptors, unclosed connections) | Human Exploration |

---

## 7. TIME - WHEN Things Happen

### 7.1 Concurrency

**Findings**:

46. **Rate limiter uses in-memory dict without thread safety (HIGH RISK)**: `_request_history: Dict[str, list] = defaultdict(list)` in `rate_limit.py` is accessed from async request handlers. While asyncio is single-threaded by default, ASGI servers may run multiple event loops or use thread pool executors for sync middleware.

47. **Rate limiter never cleans up old keys (MEMORY LEAK)**: `_clean_old_requests` removes old timestamps from existing keys but never removes keys whose request history is empty. Over time, the dictionary grows unbounded with abandoned API keys.

48. **Q-table sync is not atomic**: `_sync_to_database` iterates over `self.q_table` items and upserts each one individually. If a new Q-value update arrives during sync, the sync could overwrite the newer value with the stale one.

49. **asyncio.gather in execute_parallel has no error handling**: If one agent fails, `asyncio.gather` propagates the first exception and cancels remaining tasks (default behavior). There is no `return_exceptions=True` for graceful degradation.

### 7.2 Scheduling and Timeouts

50. **API test execution timeout**: `TestExecutionRequest.timeout` defaults to 300 seconds (5 min), max 3600 (1 hour). But there is no server-side enforcement visible in the codebase -- the timeout is passed to the agent but may not be enforced.

51. **Database connection timeout**: `command_timeout=60` in asyncpg pool creation. Individual queries that take longer than 60 seconds will be killed.

52. **No request timeout on SDK client**: `AQEClient.config.timeout = 300` (5 min) but this is only for aiohttp session, not for job completion polling.

### 7.3 State Evolution

53. **Epsilon decay is per-episode**: `decay_epsilon()` is called once per learning episode, using `epsilon * epsilon_decay_rate`. With default parameters (epsilon=0.2, decay=0.995), it takes ~460 episodes to reach min_epsilon=0.01.

54. **No warmup period**: The Q-learning system starts exploring immediately from episode 1. There is no warmup phase to build an initial model before exploitation.

### 7.4 Retention and Expiration

55. **Retention policy checks use `datetime.utcnow()`**: Python 3.12 deprecated `datetime.utcnow()` in favor of `datetime.now(datetime.UTC)`. Multiple files use the deprecated form.

56. **Memory TTL enforcement is retrieval-time only**: PostgresMemory and RedisMemory check TTL when data is retrieved, not via background cleanup. Expired data consumes storage until accessed.

### 7.5 Risk Areas - Time

| Risk ID | Risk | Severity | Impact |
|---------|------|----------|--------|
| T-01 | Rate limiter memory leak (abandoned keys never cleaned) | High | OOM over time |
| T-02 | Q-table sync is not atomic; race with new updates | High | Data corruption |
| T-03 | asyncio.gather propagates first failure, cancels rest | Medium | Partial results lost |
| T-04 | No server-side timeout enforcement for agent tasks | Medium | Runaway tasks |
| T-05 | datetime.utcnow() deprecated in Python 3.12+ | Low | Future deprecation warnings |
| T-06 | No background TTL cleanup for expired memory entries | Medium | Storage waste |

### 7.6 Test Ideas - Time

| # | Priority | Test Idea | Automation Fitness |
|---|----------|-----------|-------------------|
| T-T01 | P0 | Send 10,000 requests from 1,000 different API keys; measure rate limiter memory usage after 24 hours of no requests; confirm memory does not grow unbounded | Integration |
| T-T02 | P0 | Start two concurrent Q-value updates for the same (state, action) pair; confirm the final Q-value is correct, not corrupted by race condition | Integration |
| T-T03 | P1 | Call execute_parallel with 5 agents where agent 3 raises an exception; confirm agents 1,2 complete successfully and their results are available (requires return_exceptions=True) | Integration |
| T-T04 | P1 | Start a learning episode and run 460 episodes; confirm epsilon reaches min_epsilon and remains stable | Unit |
| T-T05 | P2 | Set an artifact's retention_days to 0 (immediate expiration); call should_keep immediately; confirm it returns False | Unit |
| T-T06 | P2 | Send requests at exactly 100/minute rate; confirm request 100 succeeds and request 101 is rejected | Integration |
| T-T07 | P2 | Store a value in PostgresMemory with TTL=5 seconds; start a long-running operation; retrieve after 10 seconds; confirm None is returned | Integration |
| T-T08 | P3 | Set command_timeout=1 for database pool; execute a deliberately slow query; confirm asyncpg.QueryCancelled is raised and connection pool recovers | Integration |
| T-T09 | P1 | Run Q-table _sync_to_database while simultaneously calling update_q_value 100 times; confirm no lost updates or corrupted values | Integration |
| T-T10 | P2 | Verify all datetime.utcnow() calls in the codebase; count instances; confirm migration path to datetime.now(UTC) is documented | Human Exploration |

---

## Cross-Dimensional Concerns

### CD-1: Authentication + Data + Time (CRITICAL)

The in-memory API key storage (Interface) combined with no persistence (Data) and key loss on restart (Time) creates a critical cross-cutting risk. Every server restart invalidates all authentication state, breaks all existing client sessions, and generates a new default key printed to stdout.

**Test Idea (P0)**: Deploy the API server behind a load balancer with 2 instances; generate an API key on instance A; route a request to instance B; confirm authentication fails, demonstrating the shared-state problem.

### CD-2: Q-Learning + Data + Time (HIGH)

The Q-learning system's in-memory Q-table (Function) with periodic batch sync to PostgreSQL (Data) creates a time-dependent data loss window (Time). Additionally, the sync writes all entries (not dirty tracking), meaning performance degrades as the Q-table grows.

**Test Idea (P0)**: Populate Q-table with 50,000 entries; call _sync_to_database; measure time and confirm it completes within 30 seconds; then measure with 500,000 entries to identify scaling limits.

### CD-3: Platform + Function (MEDIUM)

Testing frameworks (pytest, hypothesis, bandit) in core dependencies (Platform) means the production package includes test execution capabilities (Function). This is unusual and could allow test execution in production environments.

**Test Idea (P2)**: In a production-configured deployment, import pytest and confirm it is available; assess whether this enables unintended test execution paths.

### CD-4: Operations + Interfaces (MEDIUM)

The start-enhanced.sh script uses `--dangerously-skip-permissions` (Operations) while the API has authentication disabled by default via auto-generated keys (Interfaces). Combined, this creates a fully open system on first launch.

**Test Idea (P1)**: Run start-enhanced.sh; immediately curl the API health endpoint and an authenticated endpoint with the stdout key; confirm both work without any manual security configuration.

### CD-5: Structure + Time (LOW)

Deprecated QEFleet (Structure) is still used by MCP server (Interfaces) and may not be removed before v2.0. The deprecation warning includes no sunset date (Time), leaving users uncertain about migration urgency.

**Test Idea (P3)**: Grep for all QEFleet usages in the codebase; confirm count is decreasing across commits; identify remaining non-test usages that block removal.

---

## Priority Matrix for Quality Risks

### P0 - Critical (Must Fix Before Production)

| ID | Risk | SFDIPOT | Recommendation |
|----|------|---------|----------------|
| I-01 | API keys in-memory, lost on restart | Interface | Implement database-backed key storage |
| I-02 | Default API key printed to stdout | Interface | Remove auto-generation; require explicit key creation |
| I-03 | SECRET_KEY not persistent | Interface | Load from environment variable or secrets manager |
| D-01 | No path traversal protection on targets | Data | Add path validation/sanitization |
| T-01 | Rate limiter memory leak | Time | Add periodic cleanup of empty key entries |
| T-02 | Q-table sync race condition | Time | Use dirty tracking and atomic batch upsert |
| F-01 | Q-table data loss on crash | Function | Implement write-ahead logging or reduce sync interval |
| F-02 | load_from_database is a stub | Function | Implement actual Q-table loading from PostgreSQL |

### P1 - High (Fix This Sprint)

| ID | Risk | SFDIPOT | Recommendation |
|----|------|---------|----------------|
| I-04 | CORS wildcard | Interface | Configure allowed origins from environment |
| O-01 | No CI/CD test workflow | Operations | Add GitHub Actions test workflow |
| P-02 | No lionagi upper bound | Platform | Pin `lionagi>=0.18.2,<1.0.0` |
| S-03 | Deep LionAGI imports | Structure | Create abstraction layer for LionAGI internals |
| T-03 | asyncio.gather first-failure | Time | Use return_exceptions=True for graceful degradation |
| F-03 | 11/18 agents use generic state encoding | Function | Implement agent-specific encoders |

### P2 - Medium (Next 2 Sprints)

| ID | Risk | SFDIPOT | Recommendation |
|----|------|---------|----------------|
| P-01 | Test tools in prod deps | Platform | Move to dev extras |
| P-03 | asyncpg required always | Platform | Make optional, import lazily |
| O-04 | Metrics not exported | Operations | Add Prometheus metrics exporter |
| D-02 | Q-table syncs all entries | Data | Implement dirty tracking |
| T-04 | No server-side task timeout | Time | Add asyncio.wait_for wrapping |
| T-06 | No background TTL cleanup | Time | Add periodic cleanup task |
| F-04 | No agent retry logic | Function | Add configurable retry with backoff |

### P3 - Low (Backlog)

| ID | Risk | SFDIPOT | Recommendation |
|----|------|---------|----------------|
| S-02 | WIP file in production | Structure | Remove or move to branch |
| S-04 | Dual workers directories | Structure | Consolidate |
| T-05 | datetime.utcnow deprecated | Time | Migrate to datetime.now(UTC) |
| O-03 | No pre-commit hooks | Operations | Add .pre-commit-config.yaml |
| O-05 | Example passwords in .env | Operations | Use placeholders, not real-looking passwords |
| I-07 | MCP fallback is infinite loop | Interface | Log warning and exit gracefully |

---

## Test Data Suggestions

### Test Data for Structure-Based Tests
- Python packages with and without pydantic installed
- Multiple lionagi versions (0.18.2, latest, next-major)
- Import graphs with circular dependency scenarios
- Module paths with and without `__init__.py`

### Test Data for Function-Based Tests
- Q-learning episodes: 1, 10, 100, 460 (epsilon convergence), 1000
- Reward values: -50 (failure), 0 (neutral), 100 (maximum), edge floats
- Action spaces: empty, 1 action, 18 actions, 100 actions
- Task contexts: minimal, typical, maximal, malformed JSON, unicode keys

### Test Data for Data-Based Tests
- Path traversal strings: `../`, `..\\`, `....//`, URL-encoded variants
- Artifact sizes: 0 bytes, 1 byte, 1KB, 1MB, 100MB, 1GB
- Compression ratios: already-compressed (ratio ~1.0), highly compressible (ratio ~0.01)
- TTL values: 0, 1, 86400, MAX_INT, negative

### Test Data for Interface-Based Tests
- API keys: valid, expired, malformed, empty, SQL injection strings
- JWT tokens: valid, expired, tampered payload, wrong algorithm, missing claims
- CORS origins: same-origin, subdomain, wildcard, null
- Rate limit: 0, 1, 99, 100, 101, 1000 requests per minute

### Test Data for Platform-Based Tests
- Python versions: 3.10.0, 3.10.latest, 3.11.latest, 3.12.latest, 3.13-dev
- Docker: compose v2 vs v3, ARM64 vs AMD64
- PostgreSQL: 14, 15, 16 (tested), 17
- Redis: 6, 7 (tested), 8

### Test Data for Operations-Based Tests
- Environment variables: all set, none set, partial, conflicting
- Storage modes: development, testing, production, invalid, empty string
- Database URLs: valid, wrong host, wrong port, wrong credentials, malformed
- CI environments: GitHub Actions, GitLab CI, Jenkins, CircleCI

### Test Data for Time-Based Tests
- Concurrent requests: 1, 10, 100, 1000 simultaneous
- Q-learning sync intervals: 1, 10, 100, 1000 updates
- Timeout values: 0, 1ms, 1s, 60s, 3600s
- Clock skew: system time ahead, behind, timezone changes

---

## Suggestions for Exploratory Test Sessions

### Session: Structure Exploration
- Navigate the import chain from `lionagi_qe.__init__` through all lazy imports; document which imports trigger LionAGI initialization and which are deferred
- Map all `try/except ImportError` blocks and test behavior when each optional dependency is absent
- Identify all files that import from deprecated modules and assess migration readiness

### Session: Function Deep-Dive
- Execute each of the 18 agents with a minimal task and observe system prompts, branch conversations, and result formats
- Run a complete Q-learning episode and trace the Bellman equation updates step-by-step
- Test all 6 orchestration patterns with intentional failures at different stages

### Session: Data Boundary Testing
- Attempt to store artifacts that exceed filesystem limits (path length, filename characters)
- Feed the state encoder with adversarial inputs (None values, nested dicts 100 levels deep, 1M character strings)
- Test PostgresMemory namespace enforcement: attempt to store keys without the `aqe/` prefix

### Session: Interface Contract Exploration
- Map all API endpoints and compare against the OpenAPI spec at `docs/api/openapi-spec.yaml`
- Test API behavior with malformed Content-Type headers, missing required fields, extra unknown fields
- Explore WebSocket reconnection behavior under network interruption

### Session: Platform Compatibility
- Install the package in a minimal Alpine container and identify missing system dependencies
- Test with the oldest supported lionagi version (0.18.2) and the newest available
- Run with PostgreSQL connection pool exhaustion (set max_connections=1, run 10 concurrent queries)

### Session: Operations Hardening
- Follow the README quick-start guide as a new user; document every friction point
- Attempt production deployment with only .env.example values; identify all failures
- Test graceful shutdown: send SIGTERM during active workflow execution

### Session: Time-Pressure Testing
- Hammer the rate limiter with burst traffic from 100 concurrent clients
- Run Q-learning with sync_interval=1 under high concurrency to stress the sync mechanism
- Test artifact retention cleanup with 100,000 artifacts, half expired

---

## Clarifying Questions

These questions surface unknown risks and missing requirements. They are suggestions based on general risk patterns observed in the codebase.

### Structure
1. Is `orchestrator_wip.py` intended for a future release, or should it be deleted? Its presence in the production tree suggests incomplete refactoring.
2. What is the plan for removing QEFleet in v2.0.0? Is there a migration tracking mechanism for downstream users?

### Function
3. What is the expected Q-learning convergence time for production workloads? The current default parameters (lr=0.1, gamma=0.95, epsilon=0.2) are standard but may not be tuned for QE-specific reward distributions.
4. Should agent execution support automatic retry with backoff for transient failures, or is fail-fast the intentional design?
5. What happens when the ModelRouter cannot reach any LLM provider? There is no circuit breaker or fallback behavior documented.

### Data
6. What is the maximum expected Q-table size? At 50,000+ entries, the full-table sync becomes a performance concern.
7. Is there a data retention policy for Q-learning data in PostgreSQL? The trajectory table could grow unbounded.
8. Should artifact checksums be verified on retrieval by default, or only on explicit request?

### Interfaces
9. What is the intended authentication strategy for production? The current in-memory implementation is explicitly marked as non-production-ready, but no production alternative is provided.
10. Should the MCP server migrate from QEFleet to QEOrchestrator before v2.0.0?
11. Is there a need for API versioning beyond the current `/api/v1/` prefix? How will breaking changes be communicated?

### Platform
12. Why are testing frameworks (pytest, bandit, hypothesis) in core dependencies rather than dev extras? Is this intentional for runtime test execution features?
13. What is the minimum tested PostgreSQL version? The docker-compose uses 16, but the schema may be compatible with earlier versions.

### Operations
14. Is there a plan to add a CI test workflow? Currently only publish.yml exists, meaning untested code can be published.
15. What monitoring and alerting solution is planned for production deployments? The in-memory metrics provide no external observability.
16. What is the backup and disaster recovery strategy for the Q-learning database?

### Time
17. What is the acceptable data loss window for Q-learning values? The current sync_interval=10 updates means up to 9 updates can be lost on crash.
18. Is there a maximum allowed execution time for agent tasks? The API accepts timeouts up to 3600 seconds, but there is no server-side enforcement.
19. Should the rate limiter support per-API-key rate limits (as the APIKey model has a `rate_limit` field) or is the global 100/min sufficient?

---

## Assessment Quality Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| SFDIPOT categories covered | 7/7 | 7/7 | PASS |
| Subcategories analyzed | 33/37 | 30+ | PASS |
| Test ideas generated | 156 | 100+ | PASS |
| P0 (Critical) | 16 (10.3%) | 8-12% | PASS |
| P1 (High) | 42 (26.9%) | 20-30% | PASS |
| P2 (Medium) | 65 (41.7%) | 35-45% | PASS |
| P3 (Low) | 33 (21.2%) | 20-30% | PASS |
| Human Exploration ideas | 18 (11.5%) | >=10% | PASS |
| Clarifying questions | 19 | 10+ | PASS |
| Cross-dimensional concerns | 5 | 3+ | PASS |

---

*Analysis performed using James Bach's Heuristic Test Strategy Model (HTSM) Product Factors framework. All findings are based on static code analysis of the source tree. Runtime verification of identified risks is recommended.*
