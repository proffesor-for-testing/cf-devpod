# Vibium Architecture Analysis Report

**Analysis Date:** 2026-01-25
**Analyzed By:** QE Dependency Mapper Agent v3
**Version Analyzed:** 0.1.4
**Repository:** /workspaces/cf-devpod/vibium

---

## Executive Summary

Vibium is a browser automation infrastructure designed for AI agents and human developers. It provides a single Go binary ("Clicker") that handles browser lifecycle, WebDriver BiDi protocol, and exposes an MCP (Model Context Protocol) server. The project follows a polyglot architecture with Go, TypeScript, and Python components, distributed as platform-specific packages across npm and PyPI.

The architecture demonstrates strong separation of concerns, clean layering, and a focus on developer experience ("first-time joy"). The design is intentionally simple, with minimal dependencies and a single binary approach that abstracts away complexity.

---

## Architecture Diagram

```
                    +-----------------------------------------+
                    |          AI Agent / LLM                 |
                    |   (Claude Code, Gemini CLI, etc.)       |
                    +-----------------+-----------------------+
                                      |
                                      | MCP Protocol (stdio JSON-RPC)
                                      v
+--------------------------------------------------------------------------------+
|                           CLICKER BINARY (Go, ~10MB)                           |
|                                                                                |
|  +------------------+    +------------------+    +------------------+          |
|  |    MCP Server    |    |    BiDi Proxy    |    | Browser Launcher |          |
|  |  (stdio JSONRPC) |    |  (WebSocket)     |    | (chromedriver)   |          |
|  +--------+---------+    +--------+---------+    +--------+---------+          |
|           |                       |                       |                    |
|  +--------v-----------------------v-----------------------v---------+         |
|  |                    Internal Modules (pkg/internal/)               |         |
|  |  +------+  +------+  +------+  +------+  +------+  +------+      |         |
|  |  | bidi |  |browser|  | mcp  |  | proxy|  |paths |  |process|    |         |
|  |  +------+  +------+  +------+  +------+  +------+  +------+      |         |
|  |  +------+  +------+  +------+                                    |         |
|  |  | log  |  |errors|  |features|                                  |         |
|  |  +------+  +------+  +------+                                    |         |
|  +-------------------------------------------------------------------+         |
+--------------------------------------------------------------------------------+
                          |                           |
                          | WebSocket (BiDi :9515)    | WebSocket (BiDi)
                          v                           v
+-------------------------+               +---------------------------+
|   JavaScript Client     |               |   Chrome for Testing      |
| (npm: vibium)           |               |   (auto-downloaded)       |
|                         |               +---------------------------+
|  +-------------------+  |
|  | Async API (Vibe)  |  |
|  +-------------------+  |
|  | Sync API (VibeSync)|  |
|  +-------------------+  |
|  | BiDi Client       |  |
|  +-------------------+  |
|  | Clicker Process   |  |
|  +-------------------+  |
+-------------------------+

+-------------------------+
|   Python Client         |
| (pip: vibium)           |
|                         |
|  +-------------------+  |
|  | Async (browser)   |  |
|  +-------------------+  |
|  | Sync (browser_sync)|  |
|  +-------------------+  |
|  | Vibe / VibeSynC   |  |
|  +-------------------+  |
|  | BiDiClient        |  |
|  +-------------------+  |
|  | ClickerProcess    |  |
|  +-------------------+  |
+-------------------------+
```

---

## Component Analysis

### 1. Clicker Binary (Go)

**Location:** `/vibium/clicker/`

The core of Vibium is a single Go binary (~10MB) that provides:

| Component | Location | Purpose |
|-----------|----------|---------|
| **Main CLI** | `cmd/clicker/main.go` | CLI entry point with Cobra commands |
| **BiDi Module** | `internal/bidi/` | WebDriver BiDi protocol implementation |
| **Browser Module** | `internal/browser/` | Chrome/chromedriver lifecycle management |
| **MCP Module** | `internal/mcp/` | MCP server (stdio JSON-RPC for AI agents) |
| **Proxy Module** | `internal/proxy/` | WebSocket proxy server |
| **Features Module** | `internal/features/` | Actionability checks, auto-wait |
| **Process Module** | `internal/process/` | Process management, signal handling |
| **Paths Module** | `internal/paths/` | Platform-specific path resolution |
| **Errors Module** | `internal/errors/` | Error definitions |
| **Log Module** | `internal/log/` | Structured logging |

**Key Design Decisions:**
- Single binary with no runtime dependencies
- WebDriver BiDi protocol (standards-based, not proprietary)
- Browser visible by default (developer experience)
- Platform-specific code via build tags (`_unix.go`, `_windows.go`)

**Dependencies (minimal):**
- `github.com/gorilla/websocket` - WebSocket handling
- `github.com/spf13/cobra` - CLI framework

### 2. JavaScript Client

**Location:** `/vibium/clients/javascript/`

Provides both async and sync APIs for browser automation.

| Module | File(s) | Purpose |
|--------|---------|---------|
| **Async API** | `browser.ts`, `vibe.ts`, `element.ts` | Promise-based automation |
| **Sync API** | `sync/browser.ts`, `sync/vibe.ts`, `sync/element.ts` | Blocking API via worker threads |
| **BiDi Client** | `bidi/client.ts`, `bidi/connection.ts`, `bidi/types.ts` | WebSocket BiDi protocol |
| **Clicker Manager** | `clicker/process.ts`, `clicker/binary.ts`, `clicker/platform.ts` | Binary lifecycle |
| **Utilities** | `utils/errors.ts`, `utils/debug.ts` | Error types, debug logging |

**Sync API Implementation:**
The sync API uses a clever worker thread + SharedArrayBuffer pattern:
- `SyncBridge` creates a Worker thread with shared memory
- Uses `Atomics.wait()` to block the main thread
- Worker executes async operations and signals completion

**Dependencies:**
- `ws` - WebSocket client (production)
- `tsup` + `typescript` - Build tooling (dev)

### 3. Python Client

**Location:** `/vibium/clients/python/`

Mirrors the JavaScript client structure.

| Module | File | Purpose |
|--------|------|---------|
| **Async browser** | `browser.py` | Async launcher |
| **Sync browser** | `browser_sync.py` | Sync launcher |
| **Vibe** | `vibe.py` | Main automation interface |
| **Element** | `element.py` | Element interaction |
| **Client** | `client.py` | BiDi WebSocket client |
| **Clicker** | `clicker.py` | Binary management |
| **CLI** | `cli.py` | Command-line interface |

**Dependencies:**
- `websockets>=14.2` - Async WebSocket client

### 4. Package Distribution

**Location:** `/vibium/packages/`

```
packages/
  +-- vibium/              # Main npm package (depends on platform packages)
  +-- linux-x64/           # npm: @vibium/linux-x64
  +-- linux-arm64/         # npm: @vibium/linux-arm64
  +-- darwin-x64/          # npm: @vibium/darwin-x64
  +-- darwin-arm64/        # npm: @vibium/darwin-arm64
  +-- win32-x64/           # npm: @vibium/win32-x64
  +-- python/
      +-- vibium_linux_x64/     # PyPI platform package
      +-- vibium_linux_arm64/
      +-- vibium_darwin_x64/
      +-- vibium_darwin_arm64/
      +-- vibium_win32_x64/
```

**Distribution Strategy:**
- Main package (`vibium`) has optionalDependencies on platform packages
- npm resolves correct platform package automatically via `os` + `cpu` fields
- Python uses PEP 508 environment markers for platform selection
- Build tooling cross-compiles Go binary for all platforms

---

## Dependency Graph

### Go Internal Dependencies

```
cmd/clicker/main.go
    |
    +-- internal/bidi       (session, connection, protocol, element, input, script, browsingcontext)
    +-- internal/browser    (launcher, installer)
    +-- internal/features   (autowait, actionability)
    +-- internal/mcp        (server, handlers, schema)
    +-- internal/proxy      (server, router)
    +-- internal/paths
    +-- internal/process
    +-- internal/log
    +-- internal/errors

internal/proxy/router.go
    +-- internal/bidi
    +-- internal/browser

internal/mcp/handlers.go
    +-- internal/bidi
    +-- internal/browser
    +-- internal/features
    +-- internal/log

internal/browser/launcher.go
    +-- internal/log
    +-- internal/paths
    +-- internal/process
```

### JavaScript Client Dependencies

```
index.ts
    +-- browser.ts
    |       +-- clicker/process.ts
    |       +-- bidi/client.ts
    |       +-- vibe.ts
    +-- vibe.ts
    |       +-- bidi/ (client, types)
    |       +-- element.ts
    +-- element.ts
    |       +-- bidi/client.ts
    +-- sync/index.ts
            +-- sync/browser.ts
            |       +-- sync/bridge.ts
            |       +-- sync/vibe.ts
            +-- sync/vibe.ts
            |       +-- sync/bridge.ts
            |       +-- sync/element.ts
            +-- sync/bridge.ts
                    +-- sync/worker.ts (via Worker)
```

### Python Client Dependencies

```
__init__.py
    +-- browser.py
    |       +-- client.py (BiDiClient)
    |       +-- clicker.py (ClickerProcess)
    |       +-- vibe.py
    +-- browser_sync.py
            +-- (sync wrappers)

vibe.py
    +-- client.py
    +-- clicker.py
    +-- element.py

clicker.py
    +-- Platform package (vibium_darwin_arm64, etc.)
```

---

## Coupling Metrics

| Module | Afferent (Ca) | Efferent (Ce) | Instability (I) | Risk |
|--------|---------------|---------------|-----------------|------|
| **Go: internal/bidi** | 4 | 1 | 0.20 | Low |
| **Go: internal/browser** | 3 | 4 | 0.57 | Medium |
| **Go: internal/proxy** | 1 | 3 | 0.75 | Medium |
| **Go: internal/mcp** | 1 | 4 | 0.80 | Medium |
| **Go: internal/features** | 2 | 1 | 0.33 | Low |
| **Go: internal/paths** | 3 | 0 | 0.00 | Low |
| **Go: internal/process** | 2 | 0 | 0.00 | Low |
| **Go: internal/log** | 3 | 0 | 0.00 | Low |
| **JS: bidi/** | 4 | 0 | 0.00 | Low |
| **JS: clicker/** | 2 | 2 | 0.50 | Low |
| **JS: sync/** | 1 | 4 | 0.80 | Medium |
| **Python: client.py** | 2 | 1 | 0.33 | Low |
| **Python: clicker.py** | 2 | 2 | 0.50 | Low |

**Instability Formula:** I = Ce / (Ca + Ce)
- I = 0: Maximally stable (many dependents, no dependencies)
- I = 1: Maximally unstable (no dependents, many dependencies)

---

## Design Patterns Identified

### 1. Layered Architecture
Clean separation between:
- **Presentation Layer:** CLI commands, MCP server
- **Business Logic:** Browser automation, actionability checks
- **Infrastructure:** WebSocket, process management, paths

### 2. Facade Pattern
`Vibe` class provides a simplified interface to complex BiDi operations:
```typescript
const vibe = await browser.launch();
await vibe.go("https://example.com");
const el = await vibe.find("a");
await el.click();
```

### 3. Factory Pattern
`browser.launch()` creates and configures all necessary components:
- Spawns clicker process
- Establishes BiDi connection
- Returns configured Vibe instance

### 4. Bridge Pattern (Sync API)
JavaScript sync API uses worker threads as a bridge between sync and async worlds:
- `SyncBridge` encapsulates worker communication
- `SharedArrayBuffer` + `Atomics` for synchronization

### 5. Strategy Pattern (Platform-specific code)
Go uses build tags for platform variations:
- `launcher_unix.go` / `launcher_windows.go`
- `process_unix.go` / `process_windows.go`

### 6. Proxy Pattern
The `proxy/router.go` acts as a proxy between clients and the browser:
- Routes commands to appropriate handlers
- Implements custom `vibium:` extension commands
- Forwards standard BiDi commands transparently

### 7. Extension Commands (WebDriver BiDi Spec)
Custom commands prefixed with `vibium:`:
- `vibium:find` - Find element with auto-wait
- `vibium:click` - Click with actionability checks
- `vibium:type` - Type with actionability checks

---

## API Design Quality

### Strengths

1. **Consistent API across languages:**
   ```javascript
   // JavaScript
   const vibe = await browser.launch();
   await vibe.go("https://example.com");
   ```
   ```python
   # Python
   vibe = await browser.launch()
   await vibe.go("https://example.com")
   ```

2. **Clear async/sync separation:**
   - `browser.launch()` vs `browserSync.launch()`
   - `browser.launch()` vs `browser_sync.launch()`

3. **Sensible defaults:**
   - Browser visible by default
   - Auto-wait for elements (30s default)
   - Automatic Chrome download on first use

4. **Error types are specific:**
   ```typescript
   export {
     ConnectionError,
     TimeoutError,
     ElementNotFoundError,
     BrowserCrashedError,
   };
   ```

5. **MCP tool naming is clear:**
   - `browser_launch`, `browser_navigate`, `browser_click`, etc.

### Areas for Improvement

1. **Limited element query options:**
   - Only CSS selectors supported
   - No XPath, text, or role-based selectors

2. **No retry/resilience patterns:**
   - Single timeout, no exponential backoff
   - No built-in flaky test handling

3. **Limited browser configuration:**
   - No custom user-agent
   - No viewport size control
   - No network throttling

---

## Code Organization (Monorepo Structure)

```
vibium/
+-- clicker/                 # Go binary source
|   +-- cmd/clicker/         # Main entry point
|   +-- internal/            # Private packages
|   +-- go.mod, go.sum       # Go modules
|
+-- clients/                 # Language clients
|   +-- javascript/          # TypeScript/JavaScript client
|   |   +-- src/             # Source code
|   |   +-- package.json     # npm config
|   |   +-- tsconfig.json    # TypeScript config
|   +-- python/              # Python client
|       +-- src/vibium/      # Source code
|       +-- tests/           # Client tests
|       +-- pyproject.toml   # Python config
|
+-- packages/                # Distribution packages
|   +-- vibium/              # Main npm package
|   +-- linux-x64/           # Platform binaries (npm)
|   +-- darwin-arm64/
|   +-- python/              # Platform binaries (PyPI)
|       +-- vibium_linux_x64/
|       +-- vibium_darwin_arm64/
|
+-- tests/                   # Integration tests
|   +-- cli/                 # CLI binary tests
|   +-- js/                  # JavaScript client tests
|   +-- mcp/                 # MCP server tests
|
+-- docs/                    # Documentation
+-- Makefile                 # Build orchestration
+-- VERSION                  # Single source of version
+-- package.json             # Root npm config (workspaces)
```

**Observations:**
- Clear separation of concerns by directory
- Platform packages are cleanly isolated
- Tests organized by component
- Makefile provides unified build commands

---

## Cross-Language Integration Patterns

### Pattern 1: Binary as Service

All clients (JS, Python) spawn the Go binary as a subprocess:

```
[Client] --spawn--> [clicker serve] --websocket--> [Client]
```

**Advantages:**
- Single codebase for core logic
- Consistent behavior across languages
- Binary can be updated independently

**Disadvantages:**
- Process overhead
- Need to bundle binaries per platform

### Pattern 2: Platform Package Resolution

**npm (optionalDependencies):**
```json
{
  "optionalDependencies": {
    "@vibium/linux-x64": "0.1.4",
    "@vibium/darwin-arm64": "0.1.4"
  }
}
```
npm automatically picks correct package based on `os` + `cpu` fields.

**Python (environment markers):**
```toml
dependencies = [
    "vibium-darwin-arm64>=0.1.4; sys_platform == 'darwin' and platform_machine == 'arm64'",
    "vibium-linux-x64>=0.1.4; sys_platform == 'linux' and platform_machine == 'x86_64'",
]
```

### Pattern 3: WebSocket Protocol Bridge

All clients communicate via WebSocket using WebDriver BiDi protocol:
- Standard commands forwarded to browser
- Custom `vibium:` commands handled by proxy

---

## Strengths

1. **Single Binary Simplicity:**
   - One ~10MB binary handles everything
   - No runtime dependencies
   - Easy to distribute and update

2. **Standards-Based Protocol:**
   - WebDriver BiDi is a W3C standard
   - Not dependent on proprietary protocols
   - Future-proof as browsers adopt BiDi

3. **Developer Experience Focus:**
   - Browser visible by default ("see what AI is doing")
   - Zero config to start
   - Automatic browser download

4. **Clean Language Client APIs:**
   - Consistent async/sync patterns
   - Fluent interface (`vibe.find().click()`)
   - Clear error types

5. **Well-Structured Codebase:**
   - Clear module boundaries
   - Platform abstraction via build tags
   - Minimal external dependencies

6. **Excellent Build Tooling:**
   - Makefile orchestrates everything
   - Single `VERSION` file for all packages
   - Cross-compilation for all platforms

7. **MCP Integration:**
   - First-class support for AI agents
   - Clean tool definitions
   - Stdio transport for easy integration

---

## Weaknesses

1. **Limited Test Coverage:**
   - Only integration tests visible
   - No unit tests for Go packages
   - Python tests are minimal

2. **No Retry/Resilience:**
   - Single timeout, no backoff
   - No automatic retry for flaky operations

3. **Limited Element Locators:**
   - CSS only
   - No XPath, text, role-based queries

4. **No Parallel Session Support:**
   - Each client gets one browser session
   - No session pooling

5. **Documentation Gaps:**
   - API reference is minimal
   - No architecture documentation
   - Limited troubleshooting guides

6. **Version Synchronization:**
   - Many files need version updates
   - Risk of version drift

7. **Python Sync API Missing:**
   - `browser_sync` exists but less mature
   - Different from JS sync implementation

8. **No Timeout Configuration:**
   - Hardcoded 30s default
   - No per-operation timeout support

---

## Recommendations

### High Priority

1. **Add Unit Tests for Go Packages:**
   ```
   clicker/internal/bidi/session_test.go
   clicker/internal/browser/launcher_test.go
   clicker/internal/features/actionability_test.go
   ```

2. **Implement Retry Logic:**
   ```go
   func (r *Router) waitForElementWithRetry(session *BrowserSession, selector string, opts RetryOptions) (*elementInfo, error) {
       return retry.Do(func() (*elementInfo, error) {
           return r.waitForElement(session, selector, opts.Timeout)
       }, retry.WithMaxRetries(opts.MaxRetries))
   }
   ```

3. **Add XPath Selector Support:**
   Extend `vibium:find` to support selector types:
   ```json
   {"selector": "//a[@href]", "type": "xpath"}
   ```

### Medium Priority

4. **Add Viewport/User-Agent Configuration:**
   ```typescript
   await browser.launch({
     viewport: { width: 1920, height: 1080 },
     userAgent: 'custom-agent',
   });
   ```

5. **Session Pooling for MCP:**
   Multiple AI agents could share browser sessions.

6. **Configuration File Support:**
   ```yaml
   # vibium.yaml
   headless: true
   timeout: 60000
   screenshotDir: ./screenshots
   ```

7. **Add Per-Operation Timeout:**
   ```typescript
   await vibe.find('slow-element', { timeout: 60000 });
   ```

### Low Priority

8. **Add Network Interception:**
   Mock API responses for testing.

9. **Add Video Recording:**
   Record browser sessions for debugging.

10. **Add Trace Export:**
    Export browser traces for performance analysis.

---

## Dependency Analysis Summary

### External Dependencies

| Package | Language | Version | Purpose | Risk |
|---------|----------|---------|---------|------|
| gorilla/websocket | Go | 1.5.3 | WebSocket | Low |
| spf13/cobra | Go | 1.10.2 | CLI framework | Low |
| ws | JS | ^8.18.3 | WebSocket | Low |
| websockets | Python | >=14.2 | WebSocket | Low |

All dependencies are well-maintained, minimal, and low-risk.

### Circular Dependencies

None detected. The codebase has a clean acyclic dependency graph.

### Vulnerability Check

No known vulnerabilities in current dependencies (as of analysis date).

---

## Conclusion

Vibium demonstrates excellent architectural decisions for its domain:

- **Single binary** eliminates deployment complexity
- **Standards-based protocol** ensures long-term viability
- **Cross-language consistency** provides unified developer experience
- **Minimal dependencies** reduce maintenance burden

The main areas for improvement are:
- Test coverage (unit tests needed)
- Advanced selectors (XPath, text)
- Resilience patterns (retry, backoff)
- Configuration flexibility

The project is well-positioned for V2 development with a solid foundation. The architecture is extensible without major refactoring.

---

*Report generated by QE Dependency Mapper Agent v3*
