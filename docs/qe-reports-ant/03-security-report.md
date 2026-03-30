# Security Review Report: lionagi-qe-fleet

**Review Date:** 2026-03-23
**Reviewer:** QE Security Reviewer (V3)
**Project:** LionAGI QE Fleet v1.3.1
**Scope:** Full codebase security audit
**Risk Level:** MEDIUM-HIGH

---

## Executive Summary

This security review analyzed 90+ Python source files, 7 Docker/Compose configurations, shell scripts, CI/CD workflows, and test fixtures across the LionAGI QE Fleet project. The project is a quality engineering platform with a FastAPI REST API, PostgreSQL/Redis persistence, MCP server integration, and subprocess-based test execution agents.

**Overall Security Posture Score: 52/100 (NEEDS IMPROVEMENT)**

The project demonstrates security awareness in several areas -- parameterized SQL queries, subprocess `shell=False` enforcement, file path validation, and proper JWT implementation. However, critical issues remain around hardcoded credentials in Docker configurations, overly permissive CORS, unauthenticated WebSocket endpoints, and JWT secret key volatility. The largest risk surface is the combination of default credentials shipped in committed configuration files and insufficient input validation at the API boundary layer.

### Key Findings Summary

| Severity     | Count | Weighted Score |
|--------------|-------|----------------|
| CRITICAL     | 3     | 9.0            |
| HIGH         | 5     | 10.0           |
| MEDIUM       | 7     | 7.0            |
| LOW          | 4     | 2.0            |
| INFORMATIONAL| 3     | 0.75           |
| **Total**    | **22**| **28.75**      |

---

## OWASP Top 10 (2021) Mapping

| OWASP ID | Category                           | Findings | Severity Range      |
|----------|------------------------------------|----------|---------------------|
| A01      | Broken Access Control              | 3        | CRITICAL, HIGH      |
| A02      | Cryptographic Failures             | 2        | HIGH, MEDIUM        |
| A03      | Injection                          | 1        | MEDIUM              |
| A04      | Insecure Design                    | 3        | HIGH, MEDIUM        |
| A05      | Security Misconfiguration          | 5        | CRITICAL, HIGH, MEDIUM |
| A06      | Vulnerable & Outdated Components   | 1        | LOW                 |
| A07      | Identification & Authentication Failures | 3  | CRITICAL, HIGH      |
| A08      | Software & Data Integrity Failures | 1        | LOW                 |
| A09      | Security Logging & Monitoring Failures | 2    | MEDIUM, LOW         |
| A10      | Server-Side Request Forgery (SSRF) | 1        | MEDIUM              |

---

## Vulnerability Catalog

### CRITICAL Findings

---

#### SEC-001: Hardcoded Default Credentials in Docker Compose (Committed to Repository)

**Severity:** CRITICAL
**OWASP:** A05 - Security Misconfiguration, A07 - Identification & Authentication Failures
**CWE:** CWE-798 (Use of Hard-coded Credentials)

**Description:**
Multiple Docker Compose files and configuration files contain hardcoded default passwords that are committed to the repository. These are not placeholder values in `.env.example` files alone -- they are used as inline defaults in `docker-compose.yml` via the `${VAR:-default}` syntax, meaning Docker Compose will use them directly if no `.env` file is provided.

**Affected Files and Lines:**

| File | Line | Credential |
|------|------|------------|
| `docker/docker-compose.yml:12` | `POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-qe_secure_password_123}` | PostgreSQL password |
| `docker/docker-compose.yml:46` | `PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD:-admin_secure_123}` | pgAdmin password |
| `docker/docker-compose.yml:90` | `--requirepass ${REDIS_PASSWORD:-redis_secure_password_123}` | Redis password |
| `docker/pgadmin/servers.json:10` | `"Password": "qe_secure_password_123"` | **Plaintext password in JSON** |
| `database/docker-compose.yml:12` | `POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-changeme}` | PostgreSQL password |
| `database/docker-compose.yml:53` | `postgres://postgres:${POSTGRES_PASSWORD:-changeme}@postgres:5432` | Connection string with password |
| `database/docker-compose.yml:97` | `PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD:-admin}` | pgAdmin trivial password |
| `database/docker-compose.yml:137` | `GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD:-admin}` | Grafana trivial password |
| `database/.env.example:2` | `POSTGRES_PASSWORD=changeme` | Password in example |
| `database/.env.example:5` | `PGADMIN_PASSWORD=admin` | Trivial password |
| `database/.env.example:8` | `GRAFANA_PASSWORD=admin` | Trivial password |
| `database/.env.example:14` | `DATABASE_URL=postgresql://postgres:changeme@localhost:5432/qlearning_db` | Full connection string |
| `docker/.env.example:17` | `POSTGRES_PASSWORD=qe_secure_password_123` | Password in example |

**Impact:** An attacker with access to the repository (which is likely public or shared) obtains all database, cache, and admin panel credentials. If the Docker environment is deployed without overriding these defaults, all services are immediately compromised.

**Remediation:**
1. Remove ALL default password values from `docker-compose.yml` files. Use required environment variables without defaults.
2. Remove the plaintext password from `docker/pgadmin/servers.json`. Use pgAdmin's passfile mechanism or environment-based authentication instead.
3. In `.env.example` files, use clearly non-functional placeholder values like `CHANGE_ME_BEFORE_USE` and document that they MUST be changed.
4. Add a startup validation script that refuses to start if passwords match known defaults.
5. Consider using Docker secrets for sensitive values in production compose files.

---

#### SEC-002: Unauthenticated WebSocket Endpoint

**Severity:** CRITICAL
**OWASP:** A01 - Broken Access Control, A07 - Identification & Authentication Failures
**CWE:** CWE-306 (Missing Authentication for Critical Function)

**Description:**
The WebSocket streaming endpoint at `/api/v1/job/{job_id}/stream` does not perform any authentication. While all REST API endpoints require a valid API key via the `get_current_api_key` dependency, the WebSocket handler accepts connections without any credential verification.

**Affected File:** `src/lionagi_qe/api/endpoints/jobs.py:93-169`

```python
@router.websocket("/job/{job_id}/stream")
async def stream_job_progress_ws(websocket: WebSocket, job_id: str):
    # NO authentication check - accepts any connection
    await websocket.accept()
    try:
        async for update in stream_job_progress(job_id):
            await websocket.send_json(update)
```

**Impact:** Any network-accessible client can connect to the WebSocket and stream job progress data, including test results, coverage metrics, and error details. Job IDs are sequential/predictable (UUID-based but enumerable), enabling information disclosure.

**Remediation:**
```python
@router.websocket("/job/{job_id}/stream")
async def stream_job_progress_ws(websocket: WebSocket, job_id: str):
    # Validate token from query parameter or first message
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001, reason="Missing authentication token")
        return

    # Verify the token
    try:
        api_key = await verify_websocket_token(token)
    except Exception:
        await websocket.close(code=4003, reason="Invalid authentication token")
        return

    await websocket.accept()
    # ... rest of handler
```

---

#### SEC-003: JWT Secret Key Generated at Module Import (Volatile and Non-Persistent)

**Severity:** CRITICAL
**OWASP:** A02 - Cryptographic Failures, A07 - Identification & Authentication Failures
**CWE:** CWE-330 (Use of Insufficiently Random Values), CWE-798 (Hard-coded Credentials)

**Description:**
The JWT `SECRET_KEY` is generated using `secrets.token_urlsafe(32)` at module import time. While the random generation itself is cryptographically sound, the key is:

1. **Regenerated on every server restart**, invalidating all existing tokens with no warning.
2. **Not shared across multiple server instances**, meaning tokens issued by one instance are invalid on another (breaks horizontal scaling).
3. **Not persisted**, so there is no way to revoke tokens by rotating the key intentionally.

Additionally, a default API key is auto-generated and printed to stdout on every server start (lines 211-215), which in containerized/cloud environments may be captured in logging systems.

**Affected File:** `src/lionagi_qe/api/auth.py:34`

```python
SECRET_KEY = secrets.token_urlsafe(32)  # Regenerated on every restart
```

And lines 211-215:
```python
if not _api_keys:
    default_key = generate_api_key("default-test-key")
    print(f"Generated default API key: {default_key[:8]}{'*' * 24}")
```

**Impact:** Token invalidation on restart causes service disruption. In multi-instance deployments, authentication silently fails for cross-instance requests. The printed API key (even partially masked) in logs creates an information disclosure vector.

**Remediation:**
1. Load `SECRET_KEY` from an environment variable or secrets manager: `SECRET_KEY = os.environ.get("JWT_SECRET_KEY")` with a startup check that it is set.
2. Remove the auto-generated default API key in production. Use a conditional check: `if os.environ.get("ENVIRONMENT") != "production" and not _api_keys:`.
3. Never print API keys to stdout. Use structured logging at DEBUG level only in development.

---

### HIGH Findings

---

#### SEC-004: Wildcard CORS Configuration with Credentials

**Severity:** HIGH
**OWASP:** A05 - Security Misconfiguration, A01 - Broken Access Control
**CWE:** CWE-942 (Permissive Cross-domain Policy with Untrusted Domains)

**Description:**
The CORS middleware is configured with `allow_origins=["*"]` combined with `allow_credentials=True`. This allows any website to make authenticated cross-origin requests to the API.

**Affected File:** `src/lionagi_qe/api/server.py:92-98`

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,  # Combined with wildcard = dangerous
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Impact:** A malicious website visited by an authenticated user can make cross-origin requests to the API with the user's credentials, enabling cross-site request forgery (CSRF) attacks. Note: Most modern browsers block `Access-Control-Allow-Origin: *` when `Access-Control-Allow-Credentials: true` is set, but the intent is clearly misconfigured.

**Remediation:**
```python
ALLOWED_ORIGINS = os.environ.get("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
```

---

#### SEC-005: pgAdmin Deployed with Security Protections Disabled

**Severity:** HIGH
**OWASP:** A05 - Security Misconfiguration
**CWE:** CWE-1188 (Insecure Default Initialization of Resource)

**Description:**
The pgAdmin container is configured with multiple security protections explicitly disabled, making it vulnerable to session hijacking and CSRF attacks.

**Affected File:** `docker/docker-compose.yml:47-51`

```yaml
PGADMIN_CONFIG_MASTER_PASSWORD_REQUIRED: 'False'
PGADMIN_CONFIG_ENHANCED_COOKIE_PROTECTION: 'False'
PGADMIN_CONFIG_COOKIE_DEFAULT_SECURE: 'False'
PGADMIN_CONFIG_COOKIE_SAMESITE: 'Lax'
```

The override file (`docker/docker-compose.override.yml:22`) further disables cookie protection for development.

**Impact:** pgAdmin sessions can be hijacked via cookie theft. Without master password protection, anyone accessing the pgAdmin port gains immediate database admin access.

**Remediation:**
1. Do not disable `MASTER_PASSWORD_REQUIRED` or `ENHANCED_COOKIE_PROTECTION` in any environment.
2. Set `COOKIE_DEFAULT_SECURE: 'True'` for HTTPS environments.
3. Use `COOKIE_SAMESITE: 'Strict'` instead of `'Lax'`.
4. Only expose pgAdmin on localhost or behind VPN, never on public networks.

---

#### SEC-006: Redis Test Instance Deployed Without Authentication

**Severity:** HIGH
**OWASP:** A05 - Security Misconfiguration, A07 - Identification & Authentication Failures
**CWE:** CWE-306 (Missing Authentication for Critical Function)

**Description:**
The Redis instance in `database/docker-compose.yml` (lines 69-88) and `docker-compose-test.yml` (lines 26-38) is deployed without `--requirepass`, meaning any network-accessible client can read/write data without authentication.

**Affected Files:**
- `database/docker-compose.yml:77-81` - Redis command without `--requirepass`
- `docker-compose-test.yml:31` - `redis-server --appendonly yes --appendfsync everysec` (no auth)
- `database/.env.example:19` - `REDIS_URL=redis://localhost:6379/0` (no password in URL)

**Impact:** In the database compose environment, Redis stores Q-values and performance metrics. An unauthenticated attacker can read, modify, or delete learning data. In test environments, this could lead to supply-chain attacks by poisoning test data.

**Remediation:**
1. Always configure Redis with `--requirepass` in all environments.
2. Use the `REDIS_PASSWORD` environment variable consistently.
3. Update connection URLs to include authentication.

---

#### SEC-007: In-Memory API Key and Job Storage (No Persistence, No Isolation)

**Severity:** HIGH
**OWASP:** A04 - Insecure Design
**CWE:** CWE-311 (Missing Encryption of Sensitive Data), CWE-256 (Plaintext Storage of a Password)

**Description:**
API keys are stored in an in-memory Python dictionary (`_api_keys` in `auth.py:39`) and job data is stored in an in-memory dictionary (`_jobs` in `workers/tasks.py:16`). This design has multiple security implications:

1. **No access control isolation**: Any API key can access any job's status/results via the job endpoints. There is no verification that the requesting API key owns the job.
2. **No rate limit per API key enforcement**: The rate limiter uses the raw bearer token as the key identifier, meaning the same rate limit bucket is used regardless of the API key's configured `rate_limit` field.
3. **Memory exhaustion**: The `_jobs` dictionary grows unbounded with no cleanup mechanism, enabling denial of service.

**Affected Files:**
- `src/lionagi_qe/api/auth.py:39` - `_api_keys: Dict[str, APIKey] = {}`
- `src/lionagi_qe/api/workers/tasks.py:16` - `_jobs: Dict[str, Dict[str, Any]] = {}`
- `src/lionagi_qe/api/endpoints/jobs.py:21-23` - Job status endpoint lacks ownership check

**Impact:** Any authenticated user can enumerate and access other users' job results. Memory grows without bound, leading to eventual OOM crash.

**Remediation:**
1. Associate each job with its creator's API key hash and verify ownership on access.
2. Implement job expiration/cleanup to prevent memory exhaustion.
3. Migrate to a persistent store (Redis or database) for production deployments.
4. Use the API key's configured `rate_limit` value in the rate limiter.

---

#### SEC-008: Command Injection Risk in AgentDB Integration

**Severity:** HIGH
**OWASP:** A03 - Injection
**CWE:** CWE-78 (Improper Neutralization of Special Elements used in an OS Command)

**Description:**
The `AgentDBIntegration` class in `integrations/agentdb.py` passes user-controlled data directly as command-line arguments to `npx agentdb` subprocess calls. While `create_subprocess_exec` is used (which avoids shell interpretation), the arguments are still constructed from untrusted input without validation.

Specifically, `task_desc` (line 100), `critique` (line 111), `query` (line 165), and various other fields from task objects are passed directly as positional arguments to external commands.

**Affected File:** `src/lionagi_qe/integrations/agentdb.py:104-116, 167-172, 240-246, 289-293, 347-353`

```python
# Line 100-111: User-controlled data becomes command arguments
task_desc = f"{agent_id}: {task.task_type}"
cmd = [
    "npx", "agentdb", "reflexion", "store",
    session_id,
    task_desc,           # Contains user input
    str(reward),
    str(result.success).lower(),
    critique or result.get("critique", "No critique provided"),  # User input
    json.dumps(task.context if hasattr(task, "context") else {}),  # User input
    ...
]
```

**Impact:** While `create_subprocess_exec` prevents shell injection, the `npx agentdb` CLI tool may interpret certain argument patterns (e.g., `--flag` prefixed strings) as options rather than data, potentially altering command behavior. Additionally, excessively long arguments could cause resource exhaustion.

**Remediation:**
1. Validate and sanitize all input before passing to subprocess commands.
2. Add argument length limits.
3. Use `--` separator before positional arguments to prevent option injection: `["npx", "agentdb", "reflexion", "store", "--", session_id, ...]`.
4. Consider using the AgentDB library API directly instead of CLI invocation.

---

### MEDIUM Findings

---

#### SEC-009: Path Traversal Risk in Code Analyzer Tool

**Severity:** MEDIUM
**OWASP:** A01 - Broken Access Control
**CWE:** CWE-22 (Improper Limitation of a Pathname to a Restricted Directory)

**Description:**
The `CodeAnalyzerTool.analyze_code()` method accepts a `file_path` parameter and reads the file without path validation or restriction. Unlike the test executor agents which implement `validate_file_path()`, the code analyzer has no such protection.

**Affected File:** `src/lionagi_qe/tools/code_analyzer.py:83-85`

```python
if file_path and os.path.exists(file_path):
    with open(file_path, 'r') as f:
        return f.read()
```

**Impact:** If the code analyzer is exposed through an API or MCP tool that accepts user-provided file paths, an attacker could read arbitrary files from the server filesystem (e.g., `/etc/passwd`, `.env` files, private keys).

**Remediation:**
```python
import os
from pathlib import Path

ALLOWED_BASE_DIRS = [Path.cwd()]  # Or configured project roots

def _validate_path(file_path: str) -> Path:
    resolved = Path(file_path).resolve()
    if not any(str(resolved).startswith(str(base.resolve())) for base in ALLOWED_BASE_DIRS):
        raise ValueError(f"Access denied: path outside allowed directories")
    return resolved
```

---

#### SEC-010: SSRF Risk in Performance Test and Callback URL Endpoints

**Severity:** MEDIUM
**OWASP:** A10 - Server-Side Request Forgery (SSRF)
**CWE:** CWE-918 (Server-Side Request Forgery)

**Description:**
Multiple API endpoints accept a `callback_url` parameter and a `target_url` parameter (performance testing) that could be used to probe internal network resources. The `PerformanceTestRequest` model accepts any URL as `target_url` without validation against internal addresses.

**Affected Files:**
- `src/lionagi_qe/api/models.py:67-69` - `callback_url` field in `TestGenerationRequest`
- `src/lionagi_qe/api/models.py:172` - `target_url` field in `PerformanceTestRequest`
- All endpoint files that accept `callback_url`

**Impact:** An attacker could use the performance testing endpoint to scan internal services, access cloud metadata endpoints (e.g., `http://169.254.169.254/`), or trigger callbacks to attacker-controlled servers with job result data.

**Remediation:**
1. Implement URL validation that blocks internal/private IP ranges and cloud metadata endpoints.
2. Maintain an allowlist of permitted target URL patterns.
3. Validate `callback_url` against HTTPS-only and external-only policies.

---

#### SEC-011: Exception Details Exposed in API Error Responses

**Severity:** MEDIUM
**OWASP:** A04 - Insecure Design, A09 - Security Logging & Monitoring Failures
**CWE:** CWE-209 (Generation of Error Message Containing Sensitive Information)

**Description:**
Multiple API endpoint handlers catch generic `Exception` and pass `str(e)` directly as the HTTP error detail, potentially exposing internal implementation details, file paths, stack traces, or database connection strings.

**Affected Files:**
- `src/lionagi_qe/api/endpoints/fleet.py:73` - `raise HTTPException(status_code=500, detail=str(e))`
- `src/lionagi_qe/api/endpoints/test.py:75` - Same pattern
- `src/lionagi_qe/api/endpoints/test.py:133` - Same pattern
- `src/lionagi_qe/api/endpoints/coverage.py:87` - Same pattern
- `src/lionagi_qe/api/endpoints/quality.py:94` - Same pattern
- `src/lionagi_qe/api/endpoints/security.py:99` - Same pattern
- `src/lionagi_qe/api/endpoints/performance.py:101` - Same pattern
- `src/lionagi_qe/api/endpoints/jobs.py:90, 213` - Same pattern
- `src/lionagi_qe/api/endpoints/jobs.py:159-167` - WebSocket error includes `str(e)` in JSON

**Impact:** Internal error messages may contain database connection strings, file paths, or other sensitive information that aids attackers in understanding the system architecture.

**Remediation:**
```python
except Exception as e:
    logger.error(f"Internal error in endpoint: {e}", exc_info=True)
    raise HTTPException(
        status_code=500,
        detail="An internal error occurred. Please contact support."
    )
```

---

#### SEC-012: Rate Limiter Bypass via Missing API Key

**Severity:** MEDIUM
**OWASP:** A04 - Insecure Design
**CWE:** CWE-770 (Allocation of Resources Without Limits or Throttling)

**Description:**
The rate limiter extracts the API key from the `Authorization` header and uses it as the rate limit bucket key. If no header is present, it defaults to `"anonymous"`. This means ALL unauthenticated requests share a single rate limit bucket, and rate limiting is bypassed for endpoints that do not require authentication (health check is excluded, but other unauthenticated paths could exist).

More critically, the rate limiter runs BEFORE authentication, so rate-limited requests from one API key do not affect another. However, an attacker could consume the entire `"anonymous"` rate limit bucket, potentially affecting legitimate health check monitoring tools that happen to hit rate-limited paths.

**Affected File:** `src/lionagi_qe/api/rate_limit.py:35-48`

```python
def _get_api_key_from_request(self, request: Request) -> str:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:]  # Uses raw token, not hashed key
    return "anonymous"
```

**Impact:** Rate limiting does not respect per-API-key configured limits. All anonymous requests share one bucket. Memory grows unbounded as new API key strings create new buckets in `_request_history`.

**Remediation:**
1. Hash the API key for bucket lookup to normalize bucket names.
2. Implement per-IP rate limiting for unauthenticated requests.
3. Add cleanup for old rate limit buckets to prevent memory growth.

---

#### SEC-013: S3 Storage Backend SSL Verification Can Be Disabled

**Severity:** MEDIUM
**OWASP:** A02 - Cryptographic Failures
**CWE:** CWE-295 (Improper Certificate Validation)

**Description:**
The S3 storage backend accepts `verify_ssl` and `use_ssl` configuration options from `S3StorageConfig`. If these are set to `False`, the S3 client will connect without TLS or without certificate verification, enabling man-in-the-middle attacks.

**Affected File:** `src/lionagi_qe/storage/backends/s3.py:63-67`

```python
client_kwargs = {
    "region_name": config.region,
    "use_ssl": config.use_ssl,       # Can be False
    "verify": config.verify_ssl,      # Can be False
}
```

**Impact:** If SSL verification is disabled in production, an attacker performing a MITM attack can intercept and modify artifacts stored in S3, potentially injecting malicious test results.

**Remediation:**
1. Log a warning if `verify_ssl=False` or `use_ssl=False`.
2. In production mode, enforce `use_ssl=True` and `verify_ssl=True` regardless of configuration.
3. Only allow SSL verification bypass in explicitly marked development/test configurations.

---

#### SEC-014: `--dangerously-skip-permissions` Flag in Launch Scripts

**Severity:** MEDIUM
**OWASP:** A05 - Security Misconfiguration
**CWE:** CWE-732 (Incorrect Permission Assignment for Critical Resource)

**Description:**
Both `start.sh` and `start-enhanced.sh` launch Claude Code with the `--dangerously-skip-permissions` flag, which bypasses all permission prompts and allows the AI agent to perform any operation on the filesystem and system without user confirmation.

**Affected Files:**
- `start.sh:210` - `CLAUDE_CMD="claude --dangerously-skip-permissions"`
- `start.sh:213` - Same with MCP config
- `start-enhanced.sh:211-214` - Same pattern

**Impact:** In a shared development environment (like a DevPod), this grants the Claude agent unrestricted access to the filesystem, environment variables, and ability to execute arbitrary commands. If the Claude Code session is accessible to unauthorized users, this could lead to complete system compromise.

**Remediation:**
1. Remove `--dangerously-skip-permissions` from default launch scripts.
2. If needed for automation, document the security implications and require explicit opt-in via an environment variable.
3. Use a more granular permission configuration instead of blanket permission bypass.

---

#### SEC-015: Test Docker Compose Uses Weak/Empty Passwords

**Severity:** MEDIUM
**OWASP:** A05 - Security Misconfiguration
**CWE:** CWE-521 (Weak Password Requirements)

**Description:**
The test Docker Compose file uses weak hardcoded passwords without any environment variable override option.

**Affected File:** `docker-compose-test.yml:10-11`

```yaml
POSTGRES_USER: qe_agent_test
POSTGRES_PASSWORD: test_password
```

**Impact:** While this is a test database, if the test compose is accidentally deployed or if the test environment is network-accessible, the weak credentials provide trivial access. The credentials also appear in version control history.

**Remediation:**
Use environment variables with defaults only for CI: `POSTGRES_PASSWORD: ${TEST_POSTGRES_PASSWORD:-test_password_ci_only}`

---

### LOW Findings

---

#### SEC-016: API Key Partially Printed to stdout on Server Start

**Severity:** LOW
**OWASP:** A09 - Security Logging & Monitoring Failures
**CWE:** CWE-532 (Insertion of Sensitive Information into Log File)

**Description:**
On server startup, a default API key is generated and the first 8 characters are printed to stdout. While the key is partially masked, the first 8 characters (`aqe_xxxx`) significantly reduce the brute-force search space.

**Affected File:** `src/lionagi_qe/api/auth.py:214`

```python
print(f"Generated default API key: {default_key[:8]}{'*' * 24}")
```

**Impact:** In containerized environments, stdout is typically captured by logging infrastructure. The partial key disclosure aids targeted brute-force attacks.

**Remediation:**
Use `logger.info()` at DEBUG level only, and in non-production environments only.

---

#### SEC-017: SHA-256 Used for API Key Hashing (Not Keyed)

**Severity:** LOW
**OWASP:** A02 - Cryptographic Failures
**CWE:** CWE-328 (Use of Weak Hash)

**Description:**
API keys are hashed with plain SHA-256 for storage lookup. While the comment on line 70-72 correctly notes this is for lookup (not password hashing), SHA-256 without a salt means identical API keys would produce identical hashes, and if the hash database is leaked, rainbow table attacks are feasible.

**Affected File:** `src/lionagi_qe/api/auth.py:73`

```python
return hashlib.sha256(api_key.encode()).hexdigest()
```

**Impact:** Low in current context since API keys are randomly generated with high entropy (`secrets.token_urlsafe(32)`). The risk would increase if API keys were ever user-chosen.

**Remediation:**
For defense-in-depth, use HMAC-SHA256 with a server-side secret: `hmac.new(server_secret, api_key.encode(), hashlib.sha256).hexdigest()`

---

#### SEC-018: Dependency Version Pinning Too Broad

**Severity:** LOW
**OWASP:** A06 - Vulnerable and Outdated Components
**CWE:** CWE-1104 (Use of Unmaintained Third Party Components)

**Description:**
Dependencies in `pyproject.toml` use minimum version specifiers (e.g., `>=0.18.2`) without upper bounds. This allows automatic installation of major version upgrades that could introduce breaking changes or newly discovered vulnerabilities.

Key dependencies to monitor:
- `python-jose[cryptography]>=3.3.0` - Has had CVEs in the past; consider migrating to `PyJWT`
- `aiohttp>=3.9.0` - Frequently patched for security issues
- `fastapi>=0.109.0` - Generally safe but should be pinned

**Affected File:** `pyproject.toml:38-55`

**Impact:** A CI/CD pipeline could automatically pull a compromised or vulnerable dependency version.

**Remediation:**
1. Pin dependencies to specific major versions: `fastapi>=0.109.0,<1.0.0`.
2. Use a lockfile (`pip-compile` from `pip-tools`) for reproducible builds.
3. Consider migrating from `python-jose` to `PyJWT` which is more actively maintained.

---

#### SEC-019: No Audit Logging for Authentication Events

**Severity:** LOW
**OWASP:** A09 - Security Logging & Monitoring Failures
**CWE:** CWE-778 (Insufficient Logging)

**Description:**
Authentication failures (invalid API keys, expired tokens) are not logged with relevant context (source IP, attempted key prefix, timestamp). The `verify_api_key_header` function raises HTTPExceptions but does not log the attempt.

**Affected File:** `src/lionagi_qe/api/auth.py:141-192`

**Impact:** Security teams cannot detect brute-force attempts, credential stuffing, or unauthorized access patterns.

**Remediation:**
```python
logger.warning(
    "Authentication failed",
    extra={
        "source_ip": request.client.host,
        "key_prefix": token_or_key[:8] if token_or_key else "none",
        "reason": "invalid_key",
    }
)
```

---

### INFORMATIONAL Findings

---

#### SEC-020: Global Mutable State for Fleet Instance in MCP Tools

**Severity:** INFORMATIONAL
**CWE:** CWE-362 (Concurrent Execution Using Shared Resource)

**Description:**
The MCP tools module uses a global mutable variable `_fleet_instance` (line 43 in `mcp_tools.py`) to store the fleet reference. This is set via `set_fleet_instance()` and accessed via `get_fleet_instance()`. In concurrent or multi-threaded environments, this could lead to race conditions.

**Affected File:** `src/lionagi_qe/mcp/mcp_tools.py:42-56`

**Remediation:** Use a thread-safe singleton pattern or dependency injection.

---

#### SEC-021: Datetime.utcnow() Deprecated Usage

**Severity:** INFORMATIONAL

**Description:**
Multiple files use `datetime.utcnow()` which is deprecated in Python 3.12+ in favor of `datetime.now(timezone.utc)`. This is not a security vulnerability but indicates technical debt.

**Affected Files:** `auth.py:60,91,111`, `server.py:124`, `models.py:269`, multiple endpoint files.

**Remediation:** Replace with `datetime.now(timezone.utc)` throughout.

---

#### SEC-022: CI/CD Workflow Uses Broad Permissions

**Severity:** INFORMATIONAL

**Description:**
The publish workflow (`.github/workflows/publish.yml`) properly uses minimal permissions (`contents: read` at the top level, scoped `id-token: write` per job). The Sigstore signing is a good security practice. However, the `github-release` job has `contents: write` which is necessary but should be documented.

**Affected File:** `.github/workflows/publish.yml:102-103`

**Remediation:** Add a comment documenting why `contents: write` is needed for the release upload step.

---

## Files Examined and Patterns Checked

### Source Files Scanned (Full Read)

| Category | Files | Patterns Checked |
|----------|-------|-----------------|
| API/Auth | `auth.py`, `rate_limit.py`, `server.py`, `models.py` | JWT handling, CORS, rate limiting, input validation |
| Endpoints | `fleet.py`, `test.py`, `coverage.py`, `quality.py`, `jobs.py`, `security.py`, `performance.py` | Auth dependencies, error handling, input validation |
| Workers | `workers/tasks.py` | Job isolation, memory management |
| Database | `learning/db_manager.py` | SQL injection (parameterized queries confirmed) |
| Persistence | `redis_memory.py`, `postgres_memory.py` | Auth, injection, data exposure |
| Storage | `local.py`, `s3.py`, `ci.py`, `base.py` | Path traversal, SSL config |
| Tools | `code_analyzer.py` | File path validation, code execution |
| Agents | `test_executor.py`, `flaky_test_hunter.py` | Command injection, subprocess security |
| Integrations | `agentdb.py` | Command injection, input sanitization |
| MCP | `mcp_server.py`, `mcp_tools.py` | Tool injection, auth bypass |
| Core | `hooks.py` | Deserialization safety |

### Pattern Searches Performed

| Pattern | Result |
|---------|--------|
| `eval()`, `exec()`, `os.system()` | **None found** - Good |
| `pickle.load()`, `yaml.unsafe_load()` | **None in source** - Historical issues documented and fixed |
| `shell=True` in subprocess | **None found** - Explicitly set `shell=False` |
| F-string SQL injection | **None found** - All queries use parameterized `$1, $2` placeholders |
| `dangerouslySetInnerHTML`, `innerHTML` | **None found** - N/A (Python backend) |
| Hardcoded passwords in source | **None in Python source** - Only in Docker/config files |
| SSL verification disable | **Configurable in S3 backend** - Flagged as SEC-013 |

### Positive Security Findings (What Works Well)

1. **SQL Injection Prevention**: All database queries in `db_manager.py` and `postgres_memory.py` use parameterized queries with `asyncpg`'s `$1, $2` placeholder syntax. No string interpolation in SQL.

2. **Subprocess Security**: Both `test_executor.py` and `flaky_test_hunter.py` implement `validate_file_path()` for path traversal prevention and `validate_framework()` for command allowlisting. All `subprocess.run()` calls explicitly use `shell=False`.

3. **Input Validation**: The Pydantic models in `models.py` provide field validation with `ge`/`le` bounds, enum constraints, and custom validators.

4. **Pickle Deserialization**: Historical pickle vulnerabilities were identified and fixed (documented in `SECURITY.md` and `CHANGELOG.md`). Current code uses JSON serialization throughout.

5. **Sigstore Signing**: The CI/CD publish workflow signs release artifacts with Sigstore, providing supply chain integrity.

6. **API Key Hashing**: API keys are stored as SHA-256 hashes, not in plaintext.

---

## Security Posture Scoring

| Category | Max | Score | Notes |
|----------|-----|-------|-------|
| Authentication & Authorization | 20 | 10 | JWT implementation OK, but volatile secret, no WebSocket auth, no RBAC |
| Input Validation | 15 | 11 | Pydantic models good, path validation in agents, but gaps in code analyzer and MCP |
| Injection Prevention | 15 | 13 | Parameterized SQL, validated subprocess, no shell=True |
| Secrets Management | 15 | 4  | Hardcoded credentials in Docker, volatile JWT key, API key logging |
| Configuration Security | 10 | 3  | Wildcard CORS, pgAdmin security disabled, dangerous permissions |
| Dependency Security | 5  | 3  | No lockfile, broad version ranges, but no known CVEs in current versions |
| Error Handling | 5  | 3  | Raw exception details exposed in error responses |
| Logging & Monitoring | 5  | 2  | No authentication audit logging, partial key printed |
| Docker Security | 5  | 1  | Default passwords, security features disabled |
| Cryptography | 5  | 4  | HS256 JWT adequate, SHA-256 for lookup acceptable |
| **TOTAL** | **100** | **52** | |

---

## Prioritized Remediation Plan

### Phase 1: Immediate (Before Next Deployment) -- Estimated 2-4 hours

| Priority | Finding | Action | Effort |
|----------|---------|--------|--------|
| P0 | SEC-001 | Remove all hardcoded credentials from Docker files; remove plaintext password from `pgadmin/servers.json` | 1h |
| P0 | SEC-003 | Move JWT `SECRET_KEY` to environment variable; add startup validation | 30m |
| P0 | SEC-002 | Add authentication to WebSocket endpoint | 1h |
| P0 | SEC-004 | Configure explicit CORS allowed origins | 15m |

### Phase 2: Short-Term (Within 1 Sprint) -- Estimated 4-6 hours

| Priority | Finding | Action | Effort |
|----------|---------|--------|--------|
| P1 | SEC-005 | Re-enable pgAdmin security protections | 30m |
| P1 | SEC-006 | Add `--requirepass` to all Redis instances | 30m |
| P1 | SEC-007 | Implement job ownership checks and job cleanup | 2h |
| P1 | SEC-011 | Sanitize error responses across all endpoints | 1h |
| P1 | SEC-014 | Remove `--dangerously-skip-permissions` from scripts | 15m |

### Phase 3: Medium-Term (Within 2 Sprints) -- Estimated 8-12 hours

| Priority | Finding | Action | Effort |
|----------|---------|--------|--------|
| P2 | SEC-008 | Add input validation and `--` separator in AgentDB subprocess calls | 2h |
| P2 | SEC-009 | Add path validation to CodeAnalyzerTool | 1h |
| P2 | SEC-010 | Implement SSRF protection for callback_url and target_url | 2h |
| P2 | SEC-012 | Improve rate limiter with per-IP limits and bucket cleanup | 2h |
| P2 | SEC-013 | Enforce SSL in production S3 configurations | 1h |
| P2 | SEC-019 | Implement authentication audit logging | 2h |

### Phase 4: Long-Term (Technical Debt)

| Priority | Finding | Action | Effort |
|----------|---------|--------|--------|
| P3 | SEC-016 | Remove API key printing from startup; use structured logging | 30m |
| P3 | SEC-017 | Migrate to HMAC-SHA256 for key hashing | 1h |
| P3 | SEC-018 | Pin dependency versions; add lockfile; evaluate `python-jose` to `PyJWT` migration | 2h |
| P3 | SEC-015 | Parameterize test compose passwords | 15m |

---

## Clean Justification for Areas Without Findings

The following areas were reviewed and found to be clean:

- **SQL Injection**: All 15+ database queries across `db_manager.py` and `postgres_memory.py` use asyncpg parameterized queries. No string interpolation in SQL was found.
- **Deserialization**: No `pickle.loads()`, `yaml.unsafe_load()`, or `marshal.loads()` calls exist in the current source code. Historical pickle issues were properly remediated.
- **eval/exec**: No usage of `eval()`, `exec()`, `compile()`, or `__import__()` was found in any source file.
- **Shell Injection**: All subprocess calls use `shell=False` explicitly. File path validation is implemented in the test execution agents.
- **XSS**: Not applicable -- this is a Python backend API with no HTML rendering.

---

*Report generated by QE Security Reviewer (V3) -- Domain: security-compliance (ADR-008)*
*Scan duration: Full manual review*
*Files scanned: 90+*
*Confidence: 0.92*
