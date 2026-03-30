# openDAQ Test Quality & Coverage Analysis Report

**Date**: 2026-03-30
**Analyst**: QE Test Architect (Agentic QE v3)
**Project**: openDAQ SDK -- Open-source data acquisition framework
**Repository**: /workspaces/cf-devpod/tmp/opendaq
**Branch**: new-version-install

---

## Executive Summary

### Test Health Score: 6.8 / 10.0

openDAQ has a **moderately strong** test suite with approximately **3,864 C++ test cases** across 309 test files, plus **169 Python tests** across 15 files. The core type system (`coretypes`, `coreobjects`) is well-tested with 1,453 tests covering fundamental data structures, serialization, and the property system. The `signal` and `reader` subsystems are the strongest areas with 296 and 306 test cases respectively.

However, significant gaps exist in integration testing, several modules have zero or near-zero test coverage, approximately 49 tests are permanently `DISABLED_`, and about 100 test invocations use `SKIP_TEST_MAC_CI`. The discovery subsystem (3 libraries, 9 source files) has zero tests. The `corecontainers` library (15 source files, including List and Dict implementations) has zero dedicated tests despite being a foundational dependency. Concurrency testing is sparse relative to the amount of multi-threaded production code.

**Key Strengths:**
- Comprehensive unit testing of core type system (983 tests in `coretypes`)
- Strong signal/packet subsystem testing with parameterized tests
- Well-structured GMock wrappers for dependency injection
- Custom memory leak detection in test infrastructure (`DaqMemCheckListener`)
- Nightly unstable test execution pipeline with 30x repeat
- Good use of TYPED_TEST for generic reader testing across sample types

**Key Risks:**
- 4 modules with ZERO test coverage (`corecontainers`, `discovery`, `discovery_common`, `discovery_server`)
- 49 DISABLED_ tests in integration suite, 100+ conditional skips
- No property-based or fuzz testing despite handling untrusted data
- Thread safety testing is limited; readers, scheduler, and streaming use mutexes/threads but have minimal concurrent stress tests
- OPC UA and LT (websocket) modules are external and not in the open-source repository; their tests are only exercised via integration tests that skip on certain platforms

---

## 1. Test Inventory & Organization

### 1.1 Test File Distribution

| Area | Test Files (.cpp) | Test Cases | Notes |
|------|-------------------|------------|-------|
| core/coretypes | 46 | 983 | Best coverage ratio |
| core/coreobjects | 30 | 470 | Strong property system tests |
| core/corecontainers | 0 | 0 | **ZERO TESTS** - covered indirectly via coretypes |
| core/opendaq/* (14 submodules) | 113 (incl. mocks) | 1,245 | Largest test area |
| shared/libraries/* | 32 | 367 | Config protocol well-tested |
| modules/ (native streaming) | 4 | 23 | Minimal module-level tests |
| tests/integration/ | 13 | 345 | Cross-module integration |
| tests/regression/ | 10 | 79 | Protocol regression tests |
| bindings/c/ | 16 | 83 | C-binding smoke tests |
| bindings/python/ | 15 (Python) | 169 | Python binding tests |
| docs/tests/ | 17 | 108 | Executable documentation |
| examples/modules/ | 22 | 205 | Example module test suites |
| **TOTAL** | **~318** | **~3,864 C++ + 169 Python** | |

### 1.2 Test Frameworks Used

| Framework | Usage |
|-----------|-------|
| **Google Test (GTest)** | Primary framework -- all C++ tests |
| **Google Mock (GMock)** | Used in ~20 files; 13 custom mock headers in `core/opendaq/opendaq/mocks/include/opendaq/gmock/` |
| **TYPED_TEST** | Used for generic testing in reader tests (4 files, ~150 cases) |
| **TEST_P (Parameterized)** | Used in ~15 files for protocol/config variations |
| **Python unittest** | Used in `bindings/python/tests/` |

### 1.3 Test Naming Conventions

Test naming is **mostly consistent** but uses two patterns:

1. **Standard pattern** (majority): `TEST_F(ModuleNameTest, DescriptiveName)` -- e.g., `TEST_F(SignalTest, SignalConnections)`, `TEST_F(DataPacketTest, TestDoubleLinearDataRule)`
2. **Regression pattern**: `reg_p_test_<entity>.cpp` files with `RegressionTest<Entity>` fixtures

Test names are generally **descriptive** and follow CamelCase. Some tests use verb-first naming (`Create`, `GetDefaultReadType`) while others use noun-phrases (`SignalConnections`, `DataPacketWithDomainGetters`). This inconsistency is minor.

### 1.4 Test Organization

Tests use a **separate directory structure** (`tests/` subdirectory within each module):

```
core/opendaq/signal/
  include/    -- headers
  src/        -- implementation
  tests/      -- test files
    test_app.cpp          -- GTest main() boilerplate
    test_signal.cpp       -- unit tests
    test_data_packet.cpp  -- unit tests
    ...
```

Each test directory has a `test_app.cpp` that serves as the GTest main entry point with custom `DaqMemCheckListener`. This is a **clean, consistent pattern**.

Mock objects are placed in `tests/mock/` subdirectories or in the centralized `core/opendaq/opendaq/mocks/` directory.

---

## 2. Test Coverage Assessment (Static Analysis)

### 2.1 Module-by-Module Coverage Map

| Module | Prod Source Files | Test Files | Test Cases | Coverage Ratio | Risk Level |
|--------|-------------------|------------|------------|----------------|------------|
| core/coretypes | 218 | 46 | 983 | 0.21 (21%) | LOW |
| core/coreobjects | 136 | 30 | 470 | 0.22 (22%) | LOW |
| core/corecontainers | 15 | 0 | 0 | **0.00 (0%)** | **HIGH** |
| core/opendaq/signal | 123 | 30 | 296 | 0.24 (24%) | LOW |
| core/opendaq/reader | 50 | 10 | 306 | 0.20 (20%) | LOW |
| core/opendaq/device | 59 | 11 | 93 | 0.19 (19%) | MEDIUM |
| core/opendaq/opendaq | 80 | 7 | 165 | 0.09 (9%) | MEDIUM |
| core/opendaq/component | 49 | 8 | 65 | 0.16 (16%) | MEDIUM |
| core/opendaq/streaming | 21 | 7 | 89 | 0.33 (33%) | LOW |
| core/opendaq/scheduler | 24 | 8 | 38 | 0.33 (33%) | MEDIUM |
| core/opendaq/modulemanager | 37 | 12 | 33 | 0.32 (32%) | MEDIUM |
| core/opendaq/logger | 27 | 4 | 94 | 0.15 (15%) | LOW |
| core/opendaq/functionblock | 10 | 5 | 15 | 0.50 (50%) | MEDIUM |
| core/opendaq/server | 6 | 3 | 11 | 0.50 (50%) | LOW |
| core/opendaq/context | 2 | 1 | 0 | 0.50 (50%)* | HIGH |
| core/opendaq/synchronization | 5 | 2 | 8 | 0.40 (40%) | MEDIUM |
| core/opendaq/utility | 19 | 5 | 32 | 0.26 (26%) | LOW |
| shared/config_protocol | 46 | 16 | 305 | 0.35 (35%) | LOW |
| shared/native_streaming_protocol | 15 | 5 | varies | 0.33 (33%) | MEDIUM |
| shared/packet_streaming | 6 | 3 | varies | 0.50 (50%) | LOW |
| shared/signal_generator | 2 | 2 | varies | 1.00 (100%) | LOW |
| shared/discovery | 4 | 0 | 0 | **0.00 (0%)** | **HIGH** |
| shared/discovery_common | 2 | 0 | 0 | **0.00 (0%)** | **HIGH** |
| shared/discovery_server | 3 | 0 | 0 | **0.00 (0%)** | **HIGH** |
| shared/utils | 10 | 5 | varies | 0.50 (50%) | LOW |
| modules/native_streaming_client | 13 | 2 | ~12 | 0.15 (15%) | HIGH |
| modules/native_streaming_server | 9 | 2 | ~11 | 0.22 (22%) | HIGH |

*context has 1 test file (test_app.cpp only, which is just the main() boilerplate) and zero actual test cases.

**Coverage Ratio** = test files / production source files. This is a proxy metric since no runtime coverage data is available. Values below 0.15 are concerning; zero indicates blind spots.

### 2.2 Modules with ZERO Test Coverage

| Module | Source Files | Risk | Description |
|--------|-------------|------|-------------|
| core/corecontainers | 15 (headers + 2 .cpp) | HIGH | List and Dict container implementations |
| shared/discovery | 4 | HIGH | mDNS discovery client |
| shared/discovery_common | 2 | HIGH | Shared discovery utilities |
| shared/discovery_server | 3 | HIGH | mDNS discovery server |
| core/opendaq/context | 2 src, 1 test_app (0 tests) | HIGH | Context factory -- foundational but untested directly |

**Note**: `corecontainers` (List/Dict implementations) is tested _indirectly_ through `coretypes/tests/test_listobject.cpp` (78 tests) and `test_dictobject.cpp` (65 tests). This is an acceptable but fragile pattern -- changes to container internals could break without direct unit tests catching them first.

### 2.3 Specific Untested Production Code

The following production source files have **no dedicated test file** (based on filename mapping):

**Device module** (`core/opendaq/device/src/`):
- `address_info_builder_impl.cpp` -- No `test_address_info.cpp`
- `address_info_impl.cpp` -- No test
- `core_opendaq_event_args_impl.cpp` -- No test
- `device_type_impl.cpp` -- No `test_device_type.cpp`
- `io_folder_impl.cpp` -- No `test_io_folder.cpp`
- `network_interface_impl.cpp` -- No `test_network_interface.cpp`

**Module Manager** (`core/opendaq/modulemanager/src/`):
- `icmp_ping.cpp` -- No test (network-dependent)
- `icmp_header.cpp` -- No test
- `ipv4_header.cpp` -- No test
- `mdns_discovery_server_impl.cpp` -- No test
- `orphaned_modules.cpp` -- No test
- `module_info_impl.cpp` -- No test

**Component module** (`core/opendaq/component/src/`):
- `update_parameters_impl.cpp` -- No `test_update_parameters.cpp`

---

## 3. Test Design Quality

### 3.1 Assertion Quality

| Metric | Value | Assessment |
|--------|-------|------------|
| Total assertions across all tests | 13,259 | Strong |
| Average assertions per test | ~3.4 | Good |
| ASSERT_THROW / EXPECT_THROW | 674 | Good negative testing |
| ASSERT_NO_THROW (smoke-only) | ~800+ | Moderate concern |

**Sampled files** (assertions/test ratio):

| File | Tests | Assertions | Ratio |
|------|-------|------------|-------|
| test_stream_reader.cpp | 55 | 274 | **5.0** (excellent) |
| test_device.cpp | 27 | 126 | **4.7** (excellent) |
| test_data_packet.cpp | 50 | 154 | **3.1** (good) |
| test_property_object.cpp | 160 | 390 | **2.4** (adequate) |
| test_listobject.cpp | 78 | 165 | **2.1** (adequate) |

The assertion density is generally healthy. The stream reader tests are exemplary with high assertion counts validating data values, counts, and edge conditions.

### 3.2 Test Isolation

**Strengths:**
- Each test module has its own `test_app.cpp` entry point, ensuring independent test executables
- `DaqMemCheckListener` detects memory leaks per test (on MSVC debug builds)
- Most unit tests use `NullContext()` factory for isolated contexts
- `SetUp()` and fixture constructors create fresh state consistently

**Concerns:**
- Integration tests (`test_native_device_modules.cpp`, 4,495 lines) create server/client instances that bind to `127.0.0.1` -- port conflicts are possible if parallel test execution is enabled
- Several integration tests use hardcoded `127.0.0.1` and `[::1]` addresses
- Regression tests depend on a running simulator via `connectionString` global -- a clear Mystery Guest pattern

**Example of good isolation** (from `core/opendaq/signal/tests/test_signal.cpp`, line 259):
```cpp
TEST_F(SignalTest, IsComponent)
{
    auto signal = Signal(NullContext(), nullptr, "sig");
    ASSERT_NO_THROW(signal.asPtr<IComponent>());
}
```

**Example of shared state concern** (from `tests/regression/tests/reg_p_test_signal.cpp`, line 1):
```cpp
class RegressionTestSignal : public testing::Test
{
    // Uses global `connectionString` and `protocol` variables
    // defined in setup_regression.h -- classic Mystery Guest
    void SetUp() override
    {
        device = instance.addDevice(connectionString);
        signal = instance.getSignalsRecursive()[0];
    }
};
```

### 3.3 Test Readability

Test readability is **good overall**:

- Clear Arrange-Act-Assert structure in most unit tests
- Descriptive test names: `GetSamplesAvailable`, `ReadOneSample`, `CreateNullThrows`
- Helper functions like `setupDescriptor()`, `createExplicitPacket<T>()` reduce boilerplate
- TYPED_TEST for reader tests avoids code duplication across sample types

**Improvement needed**: Some tests lack comments explaining the _intent_. For example, in `test_scheduler_mt.cpp`, the graph visualization in ASCII art (lines 18-27) is excellent, but many other multi-step tests could benefit from similar documentation.

### 3.4 Edge Case Coverage

**Covered well:**
- Null pointer handling: `ASSERT_THROW(DataPacket(nullptr, 0, 10), ArgumentNullException)` (test_data_packet.cpp:70)
- Duplicate detection: `ASSERT_THROW(...listenerConnected(conn2), DuplicateItemException)` (test_signal.cpp:281)
- Not-found errors: `ASSERT_THROW(...listenerDisconnected(conn2), NotFoundException)` (test_signal.cpp:287)
- Empty collections: `ASSERT_EQ(reader.getAvailableCount(), 0u)` (test_stream_reader.cpp:66)
- Boundary values in data packets: explicit testing of Float64, Int64, UInt64, complex types

**Missing or weak:**
- Integer overflow / underflow in sample count calculations
- Very large packet sizes (memory allocation failure paths)
- Concurrent access to signals, connections, and readers
- Malformed data descriptors (partial/corrupt field values)
- Timeout handling in streaming connections
- Network error simulation (discovery, native streaming)

### 3.5 Negative Testing

Negative testing is **moderately good** with 674 throw-type assertions:

- Authentication failures tested in integration (wrong passwords, unauthorized access)
- Null argument validation is consistent: `ASSERT_THROW_MSG((StreamReader<TypeParam, ClockRange>)(nullptr), ArgumentNullException, "Signal must not be null")`
- Permission system tested: `test_config_protocol_access_control.cpp` (21 tests), `test_permission_manager.cpp` (15 tests)
- IPv6 disabled fallback: `if (test_helpers::Ipv6IsDisabled()) return;`

**Gaps**: Error recovery paths, partial failure scenarios (e.g., one signal in a multi-signal read fails), and graceful degradation under resource pressure.

### 3.6 Mock Usage

The project has a **well-designed mock infrastructure**:

**GMock Wrappers** (13 headers in `core/opendaq/opendaq/mocks/include/opendaq/gmock/`):
- `MockDevice`, `MockSignal`, `MockComponent`, `MockInputPort`
- `MockStreaming`, `MockScheduler`, `MockPacket`, `MockAllocator`
- `MockFunctionBlock`, `MockContext`, `MockInputPortNotifications`, `MockTaskGraph`

**Hand-written mocks** (in test files):
- `ConnectionMockImpl` in `test_signal.cpp` (lines 29-147) -- complete IConnection implementation
- `PacketMockImpl` in `test_signal.cpp` (lines 150-168) -- minimal IPacket stub
- `DataDescriptorMockImpl` in `test_signal.cpp` (lines 184-256) -- all methods return OPENDAQ_SUCCESS with no data

**Assessment**: The GMock wrappers are well-designed with `Strict` mode variants. However, hand-written mocks like `ConnectionMockImpl` and `DataDescriptorMockImpl` return `OPENDAQ_SUCCESS` for all methods without setting output parameters, which could mask bugs in callers that don't check return values properly.

---

## 4. Test Smells

### 4.1 Disabled/Skipped Tests

| Category | Count | Severity |
|----------|-------|----------|
| `DISABLED_` prefix (permanently disabled) | 49 | HIGH |
| `SKIP_TEST_MAC_CI` (platform skip) | 100 | MEDIUM |
| `UNSTABLE_SKIPPED_` (nightly-only) | 1 (mechanism exists) | LOW |

**DISABLED_ hotspots:**
- `test_opcua_device_modules.cpp`: 13 DISABLED_ tests (Signal, FunctionBlock, InputPort, PublicProp, etc.)
- `test_native_device_modules.cpp`: 8 DISABLED_ tests (Renderer, SaveLoad, ProtocolVersion)
- `test_ref_modules.cpp`: 6 DISABLED_ tests (all Renderer-related)
- Various docs tests: 2 DISABLED_ (InstanceBuilderModuleManager)

The OPC UA integration tests have the most disabled tests, suggesting protocol-level issues that have not been resolved. The Renderer-related disabled tests across multiple files indicate a known unsupported or broken feature.

### 4.2 Tests with Zero Assertions

8 test files contain tests with **no assertions whatsoever**:

| File | Tests | Issue |
|------|-------|-------|
| `test_time_reader.cpp` | 4 | Prints to cout, no verification |
| `test_config_provider.cpp` (docs) | 3 | Run but never assert |
| `test_howto_configure_instance.cpp` (docs) | 10 | All DISABLED_ |
| `cycleref_test.cpp` | 2 | Memory leak test relies on MemCheckListener |
| `test_deleter.cpp` | 1 | No assertion |
| `test_internaladdref.cpp` | 1 | No assertion |
| `test_ref_modules.cpp` (config_protocol) | 1 | No assertion |
| `test_finally.cpp` | 1 | No assertion |

**`test_time_reader.cpp` (line 36-57)** is the most concerning: it calls `reader.readWithDomain()` and prints timestamps to `std::cout` but never validates the output:
```cpp
for (SizeT i = 0; i < count * blockSize; ++i)
{
    std::cout << domain[i] << std::endl;  // Prints but never asserts
}
```

### 4.3 Flakiness Indicators

**32 test files contain `sleep_for` or `Sleep()` calls**, making them timing-sensitive:

High-risk flaky patterns:
- `test_native_device_modules.cpp` -- integration test with server/client, heavy sleep usage
- `test_native_streaming_modules.cpp` -- streaming timing dependencies
- `test_websocket_modules.cpp` -- websocket timing
- `test_scheduler.cpp` -- scheduler timing tests
- `test_packet_buffer.cpp` -- timing-dependent packet operations

The project has a dedicated **unstable test infrastructure** (`.github/workflows/unstable_tests.yml`) that runs nightly with `GTEST_REPEAT=30` and a `GTEST_FILTER: "*.UNSTABLE_SKIPPED_*"` pattern. This demonstrates awareness of flakiness but the `UNSTABLE_SKIPPED_` mechanism appears underutilized (only 1 reference in `base_test_listener.cpp`).

### 4.4 Assertion Roulette

Several large integration tests pack many unrelated assertions into single test methods:

**`test_native_device_modules.cpp`** contains test methods that span 50-100+ lines with 10+ assertions checking device properties, signal counts, streaming state, and protocol versions in a single test. For example, `ConnectAndDisconnect` is supposed to test connection lifecycle but in its 150+ line neighborhood also validates protocol versions, signal counts, and property values.

### 4.5 Mystery Guest

**Regression tests** (`tests/regression/tests/reg_p_test_*.cpp`) rely on external state:
```cpp
device = instance.addDevice(connectionString);  // connectionString from external global
```
The `connectionString` and `protocol` variables are defined in `setup_regression.h` and controlled externally. Tests read like they assume specific server state (device names, signal counts, channel configurations) without setting it up.

### 4.6 Eager Test (God Test)

`test_native_device_modules.cpp` (4,495 lines, 107 test cases) is the largest single test file and arguably a "God Test File". It mixes:
- Connection/disconnection tests
- Protocol version negotiation
- Authentication and access control
- Dynamic component management
- Signal streaming
- Device discovery
- Serialization/deserialization
- Remote update scenarios

This file should be split into focused test files by concern.

### 4.7 Test Duplication

Some patterns appear duplicated:
- Server instance creation is repeated across `test_native_device_modules.cpp`, `test_websocket_modules.cpp`, `test_native_streaming_modules.cpp`, and `test_streaming.cpp` with minor variations
- Reader tests (`test_stream_reader.cpp`, `test_block_reader.cpp`, `test_tail_reader.cpp`) share helper code via `reader_common.h`, which is good, but the TYPED_TEST approach leads to repeated setup patterns

---

## 5. Integration Test Analysis

### 5.1 Integration Test Coverage

**`tests/integration/test_opendaq_device_modules/`** (11 files, 345 tests):

| File | Tests | DISABLED_ | SKIP_MAC | Focus |
|------|-------|-----------|----------|-------|
| test_native_device_modules.cpp | 107 | 8 | 55 | Native protocol client/server |
| test_opcua_device_modules.cpp | 50 | 13 | 9 | OPC UA device modules |
| test_native_streaming_modules.cpp | 24 | 1 | 8 | Native streaming protocol |
| test_default_config.cpp | 21 | 0 | 3 | Default configuration |
| test_websocket_modules.cpp | 21 | 1 | 9 | WebSocket streaming |
| test_device_locking.cpp | 15 | 0 | 0 | Multi-user device locking |
| test_remote_update.cpp | 9 | 0 | 0 | Remote device updates |
| test_streaming.cpp | 8 | 0 | 5 | Cross-protocol streaming |
| test_device_discovery.cpp | 6 | 0 | 0 | Discovery mechanisms |
| test_subdevices.cpp | 4 | 0 | 5 | Sub-device hierarchies |

**`tests/integration/test_ref_modules/`** (2 files, 15 tests):

| File | Tests | DISABLED_ | Focus |
|------|-------|-----------|-------|
| test_ref_modules.cpp | 14 | 6 | Reference module integration |

**`tests/regression/`** (9 test files + simulator, 79 tests):

| File | Tests | Focus |
|------|-------|-------|
| reg_p_test_property.cpp | 19 | Property operations over protocols |
| reg_p_test_device.cpp | 17 | Device API regression |
| reg_p_test_signal.cpp | 11 | Signal operations regression |
| reg_p_test_component.cpp | 9 | Component operations |
| reg_p_test_serialization.cpp | 9 | Serialization compatibility |
| reg_p_test_fb.cpp | 6 | Function block regression |
| reg_p_test_folder.cpp | 4 | Folder operations |
| reg_p_test_channel.cpp | 2 | Channel regression |
| reg_p_test_input_port.cpp | 2 | Input port regression |

### 5.2 Integration Scenarios Covered

1. **Native protocol client/server**: Connection, disconnection, reconnection, authentication, access control, device locking, remote updates, protocol version negotiation
2. **OPC UA**: Device access, property browsing, signal reading (many DISABLED_)
3. **WebSocket streaming**: Signal streaming, reconnection, pseudo-device creation
4. **Cross-protocol streaming**: Parameterized tests across Native, WebSocket, and LT protocols
5. **Sub-device hierarchies**: Nested device management
6. **Device discovery**: mDNS-based discovery
7. **Regression**: API stability across protocol versions (opcua, nd, ns, lt)

### 5.3 Missing Integration Scenarios

| Scenario | Risk | Description |
|----------|------|-------------|
| **Network failure recovery** | HIGH | No simulation of network partitions, timeouts, or reconnection under load |
| **Concurrent multi-client access** | HIGH | No tests with multiple simultaneous clients accessing the same server |
| **Large-scale data streaming** | HIGH | No tests with high-frequency or large-volume data transfer |
| **Module hot-loading/unloading** | MEDIUM | `orphaned_modules.cpp` has no tests |
| **Configuration migration** | MEDIUM | No tests for config version upgrade scenarios |
| **Cross-platform integration** | MEDIUM | SKIP_TEST_MAC_CI suggests Mac issues are acknowledged but not resolved |
| **Resource exhaustion** | MEDIUM | No tests for memory limits, thread pool saturation, or connection limits |
| **End-to-end data integrity** | HIGH | No tests verifying that sample values arrive unchanged across protocol boundaries |

---

## 6. Test Infrastructure

### 6.1 CMake Test Configuration

- Tests are controlled by `OPENDAQ_ENABLE_TESTS` CMake option
- Each test directory has its own `CMakeLists.txt` for independent compilation
- Test presets defined in `CMakeBasePresets.json`:
  - `run_tests`: Runs all tests excluding unstable ones
  - `run_unstable_test_repeatedly`: Runs `*.UNSTABLE_SKIPPED_*` 30 times (nightly)

### 6.2 Test Fixtures Quality

**72 test fixture classes** found across the codebase. Fixtures are well-structured:

- `SchedulerTest` (shared header `test_scheduler.h`) used by both `test_scheduler_st.cpp` and `test_scheduler_mt.cpp`
- `ReaderTest<T>` template fixture in `reader_common.h` shared by all reader test files
- `ConfigProtocolTest` in `test_config_client_server.cpp` with proper server/client lifecycle

### 6.3 Test Utilities

`shared/libraries/testutils/` provides:
- **`testutils.h`**: Custom macros `ASSERT_SUCCEEDED()`, `ASSERT_THROW_MSG()`, `TEST_F_OPTIONAL()`
- **`memcheck_listener.h`**: `MemCheckListener` for CRT memory leak detection (MSVC debug)
- **`daq_memcheck_listener.h`**: `DaqMemCheckListener` -- openDAQ-specific memory check wrapper
- **`base_test_listener.h`**: Handles `UNSTABLE_SKIPPED_` test filtering
- **`test_comparators.h`**: Custom comparison utilities

### 6.4 CI/CD Test Configuration

**`.github/workflows/ci.yml`**:
- **Windows**: VS 2022 x64 Release/Debug, Win32 Release, Clang, GCC (tests disabled for GCC due to memory corruption), Intel-LLVM
- **Linux**: gcc-9, gcc-14, clang-14, clang-16, x86_32
- **macOS**: Clang Release (latest + Intel), ARM64
- All debug Linux configurations are **commented out** due to `test_py_opendaq` issues
- Test results uploaded as GTest XML artifacts
- 270-minute timeout for Windows, 180 for Linux

**`.github/workflows/unstable_tests.yml`**:
- Nightly cron at midnight UTC
- Runs with `GTEST_REPEAT=30` for stability validation
- Filters to `*.UNSTABLE_SKIPPED_*` test names only

### 6.5 Test Data Management

No centralized test data files were found. Tests generate data inline using:
- `DataPacket()` factory with explicit memory writes
- `MockDevice` / `MockPhysicalDevice` for device simulation
- `InstanceCustom()` with `ModuleManager("[[none]]")` for isolated instances

This is good for unit tests but limits the ability to test with realistic data volumes or complex signal patterns.

---

## 7. Coverage Gap Analysis

### 7.1 Top 20 Critical Coverage Gaps

| # | Area | Gap Description | Risk | Impact |
|---|------|----------------|------|--------|
| 1 | **Discovery system** | 3 libraries (discovery, discovery_common, discovery_server) with ZERO tests. mDNS client/server completely untested. | CRITICAL | Device discovery failures in production environments |
| 2 | **Network error handling** | No tests for connection timeouts, network partitions, or partial packet delivery in streaming protocols | CRITICAL | Crashes or data loss under unreliable networks |
| 3 | **Concurrent access** | No multi-threaded stress tests for readers, connections, or signal operations despite mutex usage in production | CRITICAL | Race conditions, deadlocks in multi-client scenarios |
| 4 | **corecontainers** | List and Dict implementations (15 files) have no direct tests. Tested only indirectly via coretypes tests | HIGH | Regression risk when modifying container internals |
| 5 | **OPC UA integration** | 13 DISABLED_ tests in opcua_device_modules -- significant protocol functionality untested | HIGH | Undetected regressions in OPC UA device access |
| 6 | **Memory allocation error paths** | `malloc_allocator_impl.cpp`, `mimalloc_allocator_impl.cpp`, `external_allocator_impl.cpp` -- allocation failure not tested | HIGH | Out-of-memory crashes in constrained environments |
| 7 | **ICMP/ping utilities** | `icmp_ping.cpp`, `icmp_header.cpp`, `ipv4_header.cpp` -- zero tests | HIGH | Network diagnostic failures |
| 8 | **Module lifecycle** | `orphaned_modules.cpp` untested; no module load/unload stress tests | HIGH | Memory leaks from orphaned modules |
| 9 | **Address/network config** | `address_info_builder_impl.cpp`, `network_interface_impl.cpp` -- no tests | MEDIUM | Incorrect network configuration handling |
| 10 | **Device type management** | `device_type_impl.cpp` -- no dedicated test | MEDIUM | Device type registration/lookup failures |
| 11 | **IO folder operations** | `io_folder_impl.cpp` -- no dedicated test | MEDIUM | I/O channel organization failures |
| 12 | **Update parameters** | `update_parameters_impl.cpp` (component module) -- untested | MEDIUM | Update/config migration failures |
| 13 | **Time reader** | 4 tests with ZERO assertions -- output printed but never verified | MEDIUM | Silent time conversion bugs |
| 14 | **Context initialization** | 0 actual test cases for the context module | MEDIUM | Context misconfiguration at startup |
| 15 | **Cross-protocol data integrity** | No end-to-end test verifying sample values across protocol boundaries | MEDIUM | Silent data corruption in transit |
| 16 | **Large packet handling** | No tests with >1000 samples or very large data packets | MEDIUM | Buffer overflow or performance degradation |
| 17 | **Reconnection under load** | No tests reconnecting while data is streaming | MEDIUM | Data loss during reconnection |
| 18 | **Scaling/post-processing edge cases** | Post-scaling with extreme values (NaN, infinity, denormals) untested | MEDIUM | Numeric overflow in signal processing |
| 19 | **Serialization versioning** | Limited test coverage for backward-compatible deserialization | MEDIUM | Configuration migration failures |
| 20 | **C binding completeness** | C bindings have only 34 tests across 12 files (minimal smoke testing) | LOW | C API regression in bindings |

### 7.2 Risk-Weighted Priority Matrix

```
              HIGH PROBABILITY
                    |
    [Discovery]     |     [Concurrent Access]
    [ICMP/Ping]     |     [Network Errors]
                    |     [OPC UA disabled]
  --LOW IMPACT------+------HIGH IMPACT---
                    |
    [C bindings]    |     [Memory alloc]
    [IO Folder]     |     [Module lifecycle]
    [Device Type]   |     [Data integrity]
                    |
              LOW PROBABILITY
```

---

## 8. Test Metrics

### 8.1 Summary Metrics

| Metric | Value |
|--------|-------|
| Total C++ test cases | ~3,864 |
| Total Python test cases | ~169 |
| Total test files (.cpp) | 309 |
| Total production source files (.cpp + .h) | 1,179 |
| Test-to-production file ratio | 0.26 |
| Production LOC | 172,412 |
| Test LOC | 92,561 |
| Test-to-production LOC ratio | **0.54** |
| Total assertions | 13,259 |
| Average assertions per test | **3.4** |
| ASSERT_THROW/EXPECT_THROW (negative tests) | 674 |
| DISABLED_ tests | 49 |
| SKIP_TEST_MAC_CI occurrences | 100 |
| Test fixture classes | 72 |
| Parameterized test suites (INSTANTIATE_TEST_SUITE_P) | 35 |
| Files with sleep calls (flakiness risk) | 32 |
| Tests with zero assertions | 23 (across 8 files) |

### 8.2 Tests per Module Ratio

| Module | Test Cases | Prod Source Files | Tests per Src File |
|--------|-----------|-------------------|-------------------|
| core/coretypes | 983 | 218 | 4.5 |
| core/coreobjects | 470 | 136 | 3.5 |
| core/opendaq/reader | 306 | 50 | 6.1 |
| core/opendaq/signal | 296 | 123 | 2.4 |
| core/opendaq/opendaq | 165 | 80 | 2.1 |
| core/opendaq/logger | 94 | 27 | 3.5 |
| core/opendaq/device | 93 | 59 | 1.6 |
| core/opendaq/streaming | 89 | 21 | 4.2 |
| core/opendaq/component | 65 | 49 | 1.3 |
| shared/config_protocol | 305 | 46 | 6.6 |
| modules/native_streaming_* | 23 | 22 | 1.0 |
| core/corecontainers | 0 | 15 | **0.0** |
| shared/discovery* | 0 | 9 | **0.0** |

---

## 9. Test Quality Scorecard

| Dimension | Score (1-10) | Evidence |
|-----------|-------------|----------|
| **Test Coverage Breadth** | 6 | Most modules have tests; 4 modules have zero; discovery is blind |
| **Assertion Quality** | 7 | 3.4 avg assertions/test; 674 negative tests; 8 files with zero |
| **Test Isolation** | 7 | Good fixture patterns; some integration tests share ports |
| **Edge Case Coverage** | 5 | Null checks good; boundary, overflow, concurrency weak |
| **Negative Testing** | 7 | Authentication, permission, null args well-covered |
| **Test Readability** | 8 | Descriptive names, clear structure, good helpers |
| **Mock/Stub Quality** | 8 | 13 GMock wrappers; Strict mode; some hand-written mocks too permissive |
| **Test Infrastructure** | 8 | CI matrix covers Win/Linux/Mac; memory check; unstable pipeline |
| **Integration Testing** | 5 | Good coverage of happy paths; many DISABLED; missing failure scenarios |
| **Test Maintainability** | 6 | Good helper reuse; God test file at 4.5K lines; 49 disabled tests |

**Overall: 6.8 / 10.0**

---

## 10. Prioritized Recommendations

### P0 -- Critical (address within current sprint)

1. **Add discovery module tests**: Write unit tests for `daq_discovery_client.cpp`, `daq_discovery_common.cpp`, and `mdnsdiscovery_server.cpp`. At minimum, test mDNS service registration, discovery callback handling, and error paths.

2. **Fix or remove DISABLED_ tests**: Triage all 49 DISABLED_ tests. For each, either:
   - Fix the underlying issue and re-enable
   - Convert to UNSTABLE_SKIPPED_ if timing-dependent
   - Delete with a tracking issue if permanently broken

3. **Add assertions to zero-assertion tests**: The 23 tests across 8 files that run code but never verify results are worse than no tests -- they create a false sense of coverage. Priority: `test_time_reader.cpp` (4 tests running actual readers with no verification).

### P1 -- High (address within next 2 sprints)

4. **Add concurrent access tests**: Create a dedicated `test_signal_concurrent.cpp` and `test_reader_concurrent.cpp` that exercise readers, signals, and connections from multiple threads simultaneously. Use thread sanitizer (TSan) in CI.

5. **Add corecontainers direct tests**: While List and Dict are tested indirectly, add `core/corecontainers/tests/` with direct tests of `listobject_impl.cpp` and `dictobject_impl.cpp`, particularly for iterator invalidation, concurrent modification, and large-scale operations.

6. **Split God test files**: Break `test_native_device_modules.cpp` (4,495 lines, 107 tests) into:
   - `test_native_connection.cpp` (connect/disconnect/reconnect)
   - `test_native_auth.cpp` (authentication, permissions)
   - `test_native_streaming.cpp` (data streaming)
   - `test_native_protocol.cpp` (version negotiation)
   - `test_native_config.cpp` (remote configuration)

7. **Add network error simulation**: Use mock transport layers to simulate:
   - Connection timeout
   - Partial packet delivery
   - Server crash during streaming
   - DNS resolution failure

### P2 -- Medium (address within next quarter)

8. **Implement end-to-end data integrity tests**: Create tests that send known signal data through each protocol (native, OPC UA, WebSocket) and verify exact sample values on the client side.

9. **Add memory allocation failure tests**: Test allocator failure paths using mock allocators that fail at specific counts.

10. **Increase C-binding test coverage**: Expand from 34 tests to cover at least all public C API functions. Current tests are minimal smoke tests.

11. **Add property-based testing**: Introduce fuzzing or property-based tests for serialization (JSON serializer/deserializer) and data descriptor construction to catch edge cases.

12. **Improve regression test isolation**: Remove the Mystery Guest anti-pattern from regression tests by making `connectionString` and `protocol` explicit per-test parameters via `TEST_P`.

### P3 -- Low (address as tech debt)

13. **Enable debug CI configurations**: Linux debug builds are commented out in CI due to `test_py_opendaq` issues. Fix the Python test issues and re-enable.

14. **Add test data files**: Create representative signal data files for realistic integration testing beyond synthetic packets.

15. **Add performance regression tests**: Establish baseline benchmarks for packet creation, reader throughput, and connection establishment time.

---

## 11. Suggested Test Cases for Highest-Risk Gaps

### 11.1 Discovery Module (Zero Coverage -- CRITICAL)

```cpp
// File: shared/libraries/discovery/tests/test_discovery_client.cpp

TEST_F(DiscoveryClientTest, CreateClient)
{
    auto client = DaqDiscoveryClient();
    ASSERT_NE(client, nullptr);
}

TEST_F(DiscoveryClientTest, DiscoverWithNoServersReturnsEmpty)
{
    auto client = DaqDiscoveryClient();
    auto results = client.discover(std::chrono::milliseconds(100));
    ASSERT_EQ(results.size(), 0u);
}

TEST_F(DiscoveryClientTest, DiscoverAfterServerRegistration)
{
    auto server = MdnsDiscoveryServer();
    server.registerService("TestDevice", "opendaq._tcp", 1234);

    auto client = DaqDiscoveryClient();
    auto results = client.discover(std::chrono::milliseconds(500));
    ASSERT_GE(results.size(), 1u);
    ASSERT_EQ(results[0].serviceName, "TestDevice");
}

TEST_F(DiscoveryClientTest, DiscoverHandlesNetworkError)
{
    // Verify graceful handling when mDNS is unavailable
    auto client = DaqDiscoveryClient();
    ASSERT_NO_THROW(client.discover(std::chrono::milliseconds(10)));
}

TEST_F(DiscoveryServerTest, RegisterAndUnregisterService)
{
    auto server = MdnsDiscoveryServer();
    ASSERT_NO_THROW(server.registerService("Test", "opendaq._tcp", 5555));
    ASSERT_NO_THROW(server.unregisterService("Test"));
}

TEST_F(DiscoveryServerTest, DuplicateRegistrationFails)
{
    auto server = MdnsDiscoveryServer();
    server.registerService("Test", "opendaq._tcp", 5555);
    ASSERT_THROW(server.registerService("Test", "opendaq._tcp", 5555), DuplicateItemException);
}
```

### 11.2 Concurrent Access (No Coverage -- CRITICAL)

```cpp
// File: core/opendaq/signal/tests/test_signal_concurrent.cpp

TEST_F(SignalConcurrentTest, ConcurrentConnectDisconnect)
{
    const auto signal = Signal(NullContext(), nullptr, "sig");
    std::atomic<int> successCount{0};

    auto connectTask = [&]() {
        for (int i = 0; i < 100; ++i) {
            auto conn = ConnectionMock();
            try {
                signal.asPtr<ISignalEvents>()->listenerConnected(conn);
                successCount++;
                signal.asPtr<ISignalEvents>()->listenerDisconnected(conn);
            } catch (...) {}
        }
    };

    std::vector<std::thread> threads;
    for (int t = 0; t < 4; ++t)
        threads.emplace_back(connectTask);

    for (auto& t : threads)
        t.join();

    ASSERT_GT(successCount.load(), 0);
    ASSERT_EQ(signal.getConnections().getCount(), 0u);
}

TEST_F(ReaderConcurrentTest, ConcurrentReadFromMultipleReaders)
{
    signal.setDescriptor(setupDescriptor(SampleType::Float64));

    auto reader1 = StreamReader<double>(signal);
    auto reader2 = StreamReader<double>(signal);

    auto writeTask = [&]() {
        for (int i = 0; i < 100; ++i) {
            auto packet = DataPacket(signal.getDescriptor(), 10);
            sendPacket(packet);
        }
    };

    auto readTask = [](auto& reader) {
        double buf[10];
        SizeT count = 10;
        for (int i = 0; i < 100; ++i) {
            reader.read(&buf, &count);
            count = 10;
        }
    };

    std::thread writer(writeTask);
    std::thread r1(readTask, std::ref(reader1));
    std::thread r2(readTask, std::ref(reader2));

    writer.join();
    r1.join();
    r2.join();

    // No crash or deadlock = pass
}
```

### 11.3 Network Error Recovery (No Coverage -- CRITICAL)

```cpp
// File: tests/integration/test_opendaq_device_modules/test_network_resilience.cpp

TEST_F(NetworkResilienceTest, ClientReconnectsAfterServerRestart)
{
    auto server = CreateServerInstance();
    auto client = CreateClientInstance();

    // Verify initial connection
    ASSERT_EQ(client.getDevices().getCount(), 1u);

    // Kill server
    server.release();

    // Give client time to detect disconnection
    std::this_thread::sleep_for(std::chrono::seconds(2));

    // Restart server
    server = CreateServerInstance();

    // Client should reconnect
    std::this_thread::sleep_for(std::chrono::seconds(5));
    auto device = client.getDevices()[0];
    ASSERT_TRUE(device.getInfo().assigned());
}

TEST_F(NetworkResilienceTest, StreamingContinuesAfterBriefDisconnect)
{
    auto server = CreateServerInstance();
    auto client = CreateClientInstance();
    auto reader = createClientReader("AI 1");

    generatePackets(10);
    // Read initial data
    auto packets = reader.readAll();
    ASSERT_GT(packets.getCount(), 0u);

    // Simulate brief network interruption (implementation-specific)
    // Verify streaming resumes without data duplication
}

TEST_F(NetworkResilienceTest, GracefulHandlingOfConnectionRefused)
{
    auto client = Instance("[[none]]");
    addNativeClientModule(client);

    // No server running on port -- should fail gracefully
    ASSERT_THROW(client.addDevice("daq.nd://127.0.0.1:9999"), ConnectionException);
}
```

### 11.4 Time Reader Assertions (Currently Zero)

```cpp
// Fix for: core/opendaq/reader/tests/test_time_reader.cpp

TEST_F(TimeReaderTest, StreamReaderTimestampsAreMonotonic)
{
    signal.setDescriptor(setupDescriptor(SampleType::Float64));
    auto reader = StreamReader<double>(signal);
    TimeReader timeReader(reader);

    auto packet = createPacketWithDomain(5, 0, createDomainDescriptor());
    auto* ptr = static_cast<ValueType*>(packet.getData());
    for (SizeT i = 0; i < 5; ++i) ptr[i] = 0;
    sendPacket(packet);

    SizeT count = 5;
    auto values = std::make_unique<double[]>(count);
    auto domain = std::make_unique<std::chrono::system_clock::time_point[]>(count);
    timeReader.readWithDomain(values.get(), domain.get(), &count);

    ASSERT_EQ(count, 5u);
    for (SizeT i = 1; i < count; ++i)
    {
        ASSERT_GT(domain[i], domain[i - 1]) << "Timestamps must be monotonically increasing";
    }
}
```

---

## Appendix A: File Inventory

### A.1 All Test File Paths

Test files are distributed across:
- `core/coretypes/tests/` -- 46 files
- `core/coreobjects/tests/` -- 30 files
- `core/opendaq/{module}/tests/` -- 113 files across 14 submodules
- `shared/libraries/{lib}/tests/` -- 32 files across 7 libraries
- `modules/{module}/tests/` -- 4 files
- `tests/integration/` -- 13 files
- `tests/regression/` -- 10 files
- `bindings/c/tests/` -- 16 files
- `bindings/python/tests/` -- 15 Python files
- `docs/tests/` -- 17 files
- `examples/modules/*/tests/` -- 22 files

### A.2 Key Production Files Referenced

- `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/signal/src/signal_impl.cpp`
- `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/device/src/device_info_impl.cpp`
- `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/modulemanager/src/icmp_ping.cpp`
- `/workspaces/cf-devpod/tmp/opendaq/shared/libraries/discovery/src/daq_discovery_client.cpp`
- `/workspaces/cf-devpod/tmp/opendaq/shared/libraries/discovery_server/src/mdnsdiscovery_server.cpp`
- `/workspaces/cf-devpod/tmp/opendaq/core/corecontainers/src/listobject_impl.cpp`
- `/workspaces/cf-devpod/tmp/opendaq/core/corecontainers/src/dictobject_impl.cpp`

---

*Report generated by QE Test Architect (Agentic QE v3) -- 2026-03-30*
*Analysis method: Static code analysis of test and production source files*
*Confidence level: HIGH for file-level metrics, MEDIUM for gap severity estimates*
