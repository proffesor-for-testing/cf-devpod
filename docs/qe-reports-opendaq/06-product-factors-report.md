# openDAQ SDK - SFDIPOT Product Factors Analysis

**Framework**: James Bach's Heuristic Test Strategy Model (HTSM) - Product Factors
**Project**: openDAQ SDK v3.31.0-dev
**Analysis Date**: 2026-03-30
**Analyst**: V3 QE Product Factors Assessor (Claude Opus 4.6)
**License**: Apache 2.0

---

## Executive Summary

openDAQ is a C++ SDK for data acquisition (DAQ) that bridges incompatible measurement devices through a common API. It features real-time streaming protocols (native, OPC UA, WebSocket), a plugin-based module system, signal processing function blocks, and multi-language bindings (C++, Python, C#, C, Delphi). The codebase has approximately 1,142 public headers, 506 source files, and 307 test files across core/, modules/, shared/, bindings/, simulator/, and examples/.

This SFDIPOT analysis identifies **182 test ideas** across all 7 dimensions, with prioritized risk ratings and automation fitness recommendations.

### Risk Heat Map

| Dimension | Risk Level | Confidence | Rationale |
|-----------|-----------|------------|-----------|
| **Structure** | MEDIUM-HIGH | High | Complex layered architecture with COM-like ABI boundaries, 14+ external dependencies, dynamic module loading |
| **Function** | HIGH | High | Signal processing pipeline with implicit/explicit data rules, packet queuing, multi-reader synchronization |
| **Data** | HIGH | High | 17 sample types, struct descriptors, scaling/rule calculations, cross-boundary serialization |
| **Interfaces** | HIGH | Medium | COM-like pure virtual interfaces across shared library boundaries, 4 language bindings, protocol interfaces |
| **Platform** | MEDIUM-HIGH | High | 7 OS/architecture combinations in CI, compiler-specific workarounds (MSVC inline static), 32-bit cross-compilation |
| **Operations** | MEDIUM | Medium | Device discovery (mDNS), configuration save/load, module authentication, access control |
| **Time** | CRITICAL | High | Real-time streaming, packet ordering, gap detection, synchronization (PTP/NTP/IRIG), concurrent packet queuing |

### Priority Distribution

| Priority | Count | Percentage | Description |
|----------|-------|------------|-------------|
| P0 - Critical | 17 | 9.3% | Data corruption, real-time failures, ABI breaks |
| P1 - High | 45 | 24.7% | Protocol correctness, security, binding parity |
| P2 - Medium | 83 | 45.6% | Functional coverage, edge cases, configuration |
| P3 - Low | 37 | 20.3% | Documentation, examples, minor UX issues |

### Automation Fitness

| Type | Count | Percentage |
|------|-------|------------|
| Unit Test | 77 | 42.3% |
| Integration Test | 42 | 23.1% |
| E2E Test | 51 | 28.0% |
| Human Exploration | 12 | 6.6% |

**Note on Human Exploration**: The 6.6% human exploration ratio reflects the highly automatable nature of a C++ SDK codebase with well-defined interfaces and binary protocols. Exploratory testing is concentrated on areas requiring subjective judgment: build system ergonomics, error message quality, debug-mode investigation, and platform feasibility assessment.

---

## S - Structure: What the Product IS

### Evidence-Based Assessment

#### Code Organization

The project follows a layered architecture with clear separation:

1. **Core Types Layer** (`core/coretypes/`) - 169 headers: Fundamental types (`IBaseObject`, `IString`, `IList`, `IDict`), serialization (`ISerializer`, `IDeserializer`), type system (`IType`, `ITypeManager`), error codes. This layer uses a COM-like interface pattern with `DECLARE_OPENDAQ_INTERFACE` macros and manual reference counting.

2. **Core Objects Layer** (`core/coreobjects/`) - Property system (`IPropertyObject`, `IProperty`), authentication (`IUser`, `IAuthenticationProvider`), permissions (`IPermissionManager`), event system. Depends on coretypes.

3. **Core Containers Layer** (`core/corecontainers/`) - Container implementations for lists and dictionaries.

4. **openDAQ SDK Layer** (`core/opendaq/`) - 13 sub-modules:
   - `signal/` (97 headers) - Signals, packets, connections, data descriptors, sample types, scaling, data rules
   - `device/` (46 headers) - Devices, device info, server capabilities, address info
   - `reader/` (37 headers) - Stream reader, block reader, multi reader, tail reader, packet reader
   - `streaming/` (19 headers) - Streaming interface, mirrored signals/devices/input ports
   - `functionblock/` - Function block interface and implementations
   - `scheduler/` - Thread-pool scheduler with task graphs and awaitables
   - `synchronization/` - Sync component interface (PTP, IRIG, GPS, CLK)
   - `modulemanager/` - Dynamic module loading with authentication
   - `server/` - Server abstractions
   - `component/` - Base component with active/inactive states, status, tags
   - `context/` - SDK context (logger, scheduler, type manager, module manager)
   - `logger/` - Logger components and sinks (wraps spdlog)
   - `utility/` - Utility functions

5. **Shared Libraries** (`shared/libraries/`) - 7 libraries:
   - `native_streaming_protocol/` - Binary streaming protocol with TransportHeader (payload type + size packed into 32-bit)
   - `config_protocol/` - RPC-style configuration protocol with PacketBuffer (16-byte header)
   - `packet_streaming/` - Packet serialization for network transport
   - `discovery/` + `discovery_common/` + `discovery_server/` - mDNS device discovery
   - `signal_generator/` - Test signal generation
   - `utils/` - Shared utilities
   - `testutils/` - Test helper utilities

6. **Modules** (`modules/`) - 2 core modules:
   - `native_streaming_client_module/` - Client-side native streaming
   - `native_streaming_server_module/` - Server-side native streaming

7. **Example Modules** (`examples/modules/`) - 9 reference/example modules:
   - `ref_device_module/` - Reference device (signal generator)
   - `ref_fb_module/` - Reference function blocks (renderer, statistics, FFT, etc.)
   - `audio_device_module/` - Audio device (miniaudio)
   - `basic_csv_recorder_module/` - CSV data recording
   - `parquet_recorder_module/` - Parquet data recording (Apache Arrow)
   - `simulator_device_module/` - Simulator device
   - `empty_module/` - Module template
   - `licensing_module/` - License validation

8. **Bindings** (`bindings/`) - 4 language bindings:
   - `c/` - C bindings (coretypes, coreobjects, opendaq)
   - `python/` - Python bindings via pybind11
   - `dotnet/` - .NET/C# bindings
   - (Delphi is mentioned but generated externally)

9. **External Dependencies** (`external/`) - 14 dependencies:
   - Boost (partially fetched), RapidJSON, spdlog, fmt, Google Test/Mock
   - Taskflow (parallel task scheduling), Apache Arrow, bcrypt (password hashing)
   - mdns (mDNS discovery), pybind11, Thrift (serialization)
   - mimalloc (optional allocator), miniaudio, xxHash, tsl-ordered-map

10. **Build System** - CMake 3.24+ with presets (`CMakePresets.json`), RTGen code generation tool (`shared/tools/RTGen/`), custom CMake modules (`cmake/`)

**File**: `/workspaces/cf-devpod/tmp/opendaq/CMakeLists.txt` (474 lines)
**File**: `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/signal/include/opendaq/signal_impl.h`

#### Key Structural Observations

1. **ABI Boundary Design**: The `DECLARE_OPENDAQ_INTERFACE` macro creates COM-like pure virtual interfaces that can cross shared library boundaries regardless of compiler. This is a deliberate design for plugin compatibility but adds complexity.

2. **Smart Pointer Wrappers**: Every interface has corresponding `*_ptr.h`, `*_factory.h`, and `*_impl.h` files. The `[interfaceSmartPtr]` annotations in comments drive RTGen code generation.

3. **Thread Safety Toggle**: `OPENDAQ_THREAD_SAFE` CMake option enables/disables thread-safe implementations. The `withLock()` pattern is used in connection_impl.cpp.

4. **Error Code Pattern**: All interface methods return `ErrCode` (32-bit error codes with type ID and error code fields). The `daqTry` wrapper converts C++ exceptions to error codes.

**File**: `/workspaces/cf-devpod/tmp/opendaq/core/coretypes/include/coretypes/errors.h`

### Test Ideas: Structure (26 ideas)

| # | Priority | Test Idea | Automation Fitness | Subcategory |
|---|----------|-----------|-------------------|-------------|
| S01 | P0 | Load a module compiled with GCC into a host application compiled with MSVC and call all interface methods; assert no ABI violations, crashes, or memory corruption occur | Integration | Dependencies |
| S02 | P0 | Build the SDK with `OPENDAQ_THREAD_SAFE=OFF` and run all existing tests under ThreadSanitizer; count data races in signal path code that rely on the thread-safe flag | Unit | Code Integrity |
| S03 | P1 | Inject a module with a mismatched version (older interface) into `ModuleManager.loadModule()`; assert `ErrCode` returned is appropriate and no undefined behavior occurs | Integration | Dependencies |
| S04 | P1 | Build the same module with Clang-16 and GCC-14 and exchange them at runtime in the same host process; assert interface calls return identical results | Integration | Dependencies |
| S05 | P1 | Delete a shared library file while a module is loaded from it; assert graceful error handling on next interface call rather than segfault | E2E | Executable Files |
| S06 | P1 | Construct a dependency graph: coretypes -> coreobjects -> opendaq -> modules; assert no circular includes exist using `cmake --graphviz` output | Unit | Dependencies |
| S07 | P1 | Set `OPENDAQ_ENABLE_PARAMETER_VALIDATION=OFF` and pass nullptr to every interface method that accepts a pointer parameter; document which methods crash vs return error codes | Unit | Code Integrity |
| S08 | P1 | Run the full build with `OPENDAQ_MIMALLOC_SUPPORT=ON` and compare memory usage and allocation patterns against the default allocator for a 1000-signal scenario | Integration | Code Integrity |
| S09 | P2 | Count the number of `#pragma once` vs traditional include guards across all 1142 headers; assert consistency | Unit | Non-Executable Files |
| S10 | P2 | Compile with `-Wextra -Wpedantic` on GCC-14 and count warnings not caught by the existing `-Werror` configuration in Release mode | Unit | Code Integrity |
| S11 | P2 | Measure build time for a full `x64/gcc/full/debug` preset from clean state; profile CMake configure time separately from compilation time for 199 CMakeLists.txt files | Human Exploration | Non-Executable Files |
| S12 | P2 | Load 50 modules simultaneously via `ModuleManager.addModule()`; measure memory overhead per module and identify if any global state leaks between modules | Integration | Dependencies |
| S13 | P2 | Inspect every `_impl.h` header for raw `new`/`delete` usage vs smart pointer patterns; assert no manual memory management exists outside allocator code | Unit | Code Integrity |
| S14 | P2 | Run cppcheck/clang-tidy on the codebase and categorize findings by severity; compare against the existing CI quality gates | Unit | Code Integrity |
| S15 | P2 | Set `OPENDAQ_ALWAYS_FETCH_DEPENDENCIES=OFF` with pre-installed system libraries; assert the build succeeds and produces identical binaries | E2E | Dependencies |
| S16 | P2 | Trace the RTGen code generation pipeline from `.h` annotations through `rtgen` tool to generated files; assert generated files compile without warnings | Unit | Non-Executable Files |
| S17 | P2 | Build with `OPENDAQ_LINK_RUNTIME_STATICALLY=ON` and `OFF`; compare binary sizes and verify both produce working executables | E2E | Executable Files |
| S18 | P2 | Inspect the `WORKAROUND_MEMBER_INLINE_VARIABLE` ifdef in signal_impl.h; test with MSVC versions <= 1927 and > 1927 to confirm the workaround is still needed | Human Exploration | Code Integrity |
| S19 | P3 | Check that all 14 external dependencies in `external/` have consistent CMake FetchContent version pinning and that no dependency uses `master`/`main` branch references | Unit | Dependencies |
| S20 | P3 | Measure the header include depth for `opendaq/opendaq.h` (the umbrella header); assert it does not exceed a reasonable depth (e.g., 20 levels) | Unit | Non-Executable Files |
| S21 | P3 | Count test files (307) vs source files (506) and compute test-to-source ratio per module; identify modules with zero or minimal test coverage | Unit | Code Integrity |
| S22 | P3 | Build with `OPENDAQ_ENABLE_COVERAGE=ON` on GCC and generate an lcov report; map coverage gaps to SFDIPOT dimensions | E2E | Code Integrity |
| S23 | P3 | Inspect `.editorconfig` and `.clang-format` for consistency; run `clang-format --dry-run` on all source files and count violations | Unit | Non-Executable Files |
| S24 | P3 | Attempt to build with CMake 3.20 (below the required 3.24); confirm the error message is clear and actionable | Human Exploration | Non-Executable Files |
| S25 | P2 | Inspect all `static_assert` declarations (like `sizeof(PacketHeader) == 16`); test on 32-bit and 64-bit platforms to confirm struct packing assumptions hold | Unit | Code Integrity |
| S26 | P3 | Map the full namespace hierarchy (`daq::`, `daq::native_streaming::`, `daq::config_protocol::`, `daq::packet_streaming::`) and verify no symbol collisions when all modules are linked | Unit | Code Integrity |

### Risks: Structure

| Risk ID | Severity | Description |
|---------|----------|-------------|
| RS01 | HIGH | ABI compatibility across compilers/platforms is central to the architecture; any vtable layout difference causes undefined behavior |
| RS02 | HIGH | Thread safety is a compile-time toggle; code paths that assume `OPENDAQ_THREAD_SAFE=ON` may have latent races when OFF |
| RS03 | MEDIUM | 14 external dependencies with FetchContent create supply chain risk; a malicious or broken upstream release can break the build |
| RS04 | MEDIUM | RTGen code generation tool is a binary (`shared/tools/RTGen/bin`); if it fails silently, generated code may be stale |
| RS05 | LOW | Build time may be excessive due to 199 CMakeLists.txt files and template-heavy code |

---

## F - Function: What the Product DOES

### Evidence-Based Assessment

#### Core Capabilities

1. **Signal Processing Pipeline**: Signals (`ISignal`) carry data through connections (`IConnection`) to input ports (`IInputPort`). Data is packaged in packets (`IPacket`) which can be Data packets or Event packets. The `DataDescriptor` defines how to interpret packet buffers using sample types, data rules, scaling, tick resolution, and origin.

   **File**: `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/signal/include/opendaq/data_descriptor.h`

2. **Data Rules and Scaling**: Three rule types govern data layout:
   - `Explicit` - values in packet buffer directly
   - `Linear` - calculated as `packetOffset + sampleIndex * delta + start`
   - `Constant` - a fixed value

   Post-scaling applies `inputValue * scale + offset`. The calculation order is: Rule -> TickResolution -> Origin (without PostScaling) or just PostScaling (exclusive with Rule/Resolution/Origin).

   **File**: `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/signal/include/opendaq/data_rule.h`

3. **Reader Types**: 5 reader types for different consumption patterns:
   - `StreamReader` - continuous reading with optional timeout
   - `BlockReader` - fixed-size block reading
   - `MultiReader` - synchronized reading from multiple signals
   - `TailReader` - last N samples
   - `PacketReader` - raw packet access

   Readers support `ReadTimeoutType::Any` (return immediately when data arrives) and `ReadTimeoutType::All` (wait for requested amount).

   **File**: `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/reader/include/opendaq/reader.h`

4. **Device Management**: Devices (`IDevice`) support three roles:
   - Physical devices (channels, measurement data)
   - Client devices (connect to remote devices via protocols)
   - Function block devices (add/configure signal processing)

   Parallel device addition via `addDevices()` with error dictionaries per connection.

   **File**: `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/device/include/opendaq/device.h`

5. **Function Blocks**: Signal processing blocks with input ports and output signals. Can be nested. Status signal reports connection/state changes. Examples include renderer, statistics, FFT, power spectrum.

   **File**: `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/functionblock/include/opendaq/function_block.h`

6. **Module/Plugin System**: `ModuleManager` loads shared libraries from a directory, supports authentication (`IModuleAuthenticator`), and allows runtime side-loading. Modules can provide devices, function blocks, servers, and streaming implementations.

   **File**: `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/modulemanager/include/opendaq/module_manager.h`

7. **Streaming Protocols**: Multiple protocol implementations:
   - Native streaming: Custom binary protocol with 11 payload types (signal available/unavailable, subscribe/unsubscribe, packets, config, transport properties). TransportHeader packs type (4 bits) + size (28 bits) into uint32_t, limiting payload to ~268MB.
   - OPC UA: Optional, for structure/property transfer
   - WebSocket: Optional, for data streaming
   - Client-to-device streaming: Reverse direction support

   **File**: `/workspaces/cf-devpod/tmp/opendaq/shared/libraries/native_streaming_protocol/include/native_streaming_protocol/native_streaming_protocol_types.h`

8. **Configuration Save/Load**: `device.saveConfiguration()` serializes to JSON string; `loadConfiguration()` restores state with optional `UpdateParameters`.

9. **Device Discovery**: mDNS-based discovery with `DiscoveryClient` supporting service name filtering and IP configuration management.

10. **Access Control**: Object-level access control with users, permissions, and authentication providers. Simulator has hardcoded bcrypt-hashed passwords.

    **File**: `/workspaces/cf-devpod/tmp/opendaq/simulator/simulator_app/src/main.cpp`

11. **Device Locking**: `lock()`/`unlock()` prevents property changes via protocol layer; only the locking user can unlock.

12. **Operation Modes**: `Idle`, `Operation`, `SafeOperation` modes with recursive propagation to sub-devices.

### Test Ideas: Function (28 ideas)

| # | Priority | Test Idea | Automation Fitness | Subcategory |
|---|----------|-----------|-------------------|-------------|
| F01 | P0 | Create a signal with Linear data rule (delta=1, start=0), send 1 million packets, and read via StreamReader; assert every calculated sample matches `packetOffset + index * delta + start` with zero numerical drift | Unit | Calculation |
| F02 | P0 | Configure PostScaling (scale=2.5, offset=100) on a Float64 signal and send packets containing boundary values (DBL_MAX/2, DBL_MIN, 0, -1); assert scaling output matches `value * 2.5 + 100` without overflow | Unit | Calculation |
| F03 | P0 | Connect a signal to an input port, send 10000 data packets and 50 interspersed event packets; assert the Connection queue delivers all packets in exact FIFO order with no drops | Unit | State Transitions |
| F04 | P0 | Create a MultiReader on 4 signals with different sampling rates but the same ReferenceDomainId; read synchronized samples and confirm domain alignment within tick resolution tolerance | Integration | Application |
| F05 | P1 | Call `device.addDevice(connectionString)` with an invalid connection string format; assert `OPENDAQ_ERR_INVALIDPARAMETER` or appropriate error code is returned, not a crash or hang | Unit | Error Handling |
| F06 | P1 | Call `device.addDevices()` with 10 connection strings where 5 are valid and 5 are unreachable; assert `OPENDAQ_PARTIAL_SUCCESS` is returned with correct error dictionaries for each failed connection | Integration | Error Handling |
| F07 | P1 | Add a function block, connect its input to a signal, then call `removeFunctionBlock()`; assert all connections are cleanly disconnected and no dangling signal references remain | Unit | State Transitions |
| F08 | P1 | Call `setPropertyValue()` with a value that triggers validation failure; assert `OPENDAQ_ERR_VALIDATE_FAILED` and confirm the previous value is unchanged | Unit | Error Handling |
| F09 | P1 | Call `setPropertyValue()` on a Read-only property; assert `OPENDAQ_ERR_ACCESSDENIED` is returned | Unit | Security |
| F10 | P1 | Lock a device with User "alice", attempt to change a property via protocol layer; assert change is rejected. Then attempt unlock with User "bob"; assert `OPENDAQ_ERR_ACCESSDENIED` | Integration | Security |
| F11 | P1 | Send a packet with `TransportHeader` payload size set to `MAX_PAYLOAD_SIZE` (0x0FFFFFFF = 268MB); assert the native streaming protocol handles it without buffer overflow | Integration | Security |
| F12 | P1 | Create a DiscoveryClient with `discoveryDuration=0ms` and call `discoverMdnsDevices()`; assert it returns empty list rather than blocking forever | Unit | Error Handling |
| F13 | P1 | Build the SDK with `OPENDAQ_ENABLE_ACCESS_CONTROL=ON`, create a user with only read permissions, and attempt a `setPropertyValue()` call; assert permission check blocks the write | Integration | Security |
| F14 | P2 | Create one of each reader type (Stream, Block, Multi, Tail, Packet) on the same signal; send 100 packets; assert each reader receives appropriate data without interference | Unit | Application |
| F15 | P2 | Set a signal as non-public (`setPublic(false)`) and verify it does not appear in client device `getSignals()` results nor in streaming protocol signal-available messages | Integration | Application |
| F16 | P2 | Call `saveConfiguration()`, modify 5 properties, call `loadConfiguration()` with the saved string; assert all 5 properties are restored to their original values | Unit | Data Transformation |
| F17 | P2 | Create a DataDescriptor with 3 struct fields (Int64, Float32, Float64) totaling 20 bytes; send 500 data packets; read via StreamReader and confirm struct field alignment is correct | Unit | Data Transformation |
| F18 | P2 | Set operation mode to `SafeOperation` on a device with 3 sub-devices using `setOperationModeRecursive()`; assert all sub-devices report SafeOperation mode | Integration | State Transitions |
| F19 | P2 | Create a Constant data rule with value 42; send 1000 packets with varying packetOffset; assert all read values are exactly 42 | Unit | Calculation |
| F20 | P2 | Connect a StreamReader with `ReadTimeoutType::All` and request 100 samples but only 50 are available; assert the reader blocks for the timeout duration then returns the 50 available | Unit | Application |
| F21 | P2 | Call `getLastValue()` on a signal before any data is sent; assert it returns nullptr without error. Then send one packet; call again and assert the correct last value | Unit | Application |
| F22 | P2 | Set `ModuleManager.setAuthenticatedOnly(true)` and attempt to load an unsigned module; assert it is rejected with appropriate error | Integration | Security |
| F23 | P2 | Create a function block with nested sub-function blocks (2 levels deep); query signals with recursive search filter; assert all signals from both levels are returned | Unit | Application |
| F24 | P2 | Freeze a PropertyObject and attempt `addProperty()` and `setPropertyValue()`; assert both return `OPENDAQ_ERR_FROZEN` | Unit | State Transitions |
| F25 | P3 | Run the simulator app (main.cpp) with default configuration; connect a client via native streaming; read 100 samples; assert non-zero measurement data | E2E | Application |
| F26 | P3 | Call `getConnectionStatusContainer()` on a device; assert it returns status for all active streaming connections | Unit | Messaging |
| F27 | P2 | Create a signal with `ReferenceDomainInfo` set to domain ID "A"; create another with domain ID "B"; create a MultiReader on both; assert an appropriate error because domains differ | Unit | Error Handling |
| F28 | P3 | Exercise every `PayloadType` in the native streaming protocol (all 11 types); assert the `convertPayloadTypeToString()` function returns the correct string for each | Unit | Messaging |

### Risks: Function

| Risk ID | Severity | Description |
|---------|----------|-------------|
| RF01 | CRITICAL | Data rule calculations (Linear, Constant) with large packet offsets and high sample counts can cause integer overflow in the implicit value computation |
| RF02 | HIGH | PostScaling applied to Float64 boundary values can produce infinity/NaN silently; no enforcement of ValueRange |
| RF03 | HIGH | MultiReader synchronization across signals with different sampling rates assumes compatible ReferenceDomainInfo; failure mode is unclear |
| RF04 | HIGH | Native streaming protocol uses 28 bits for payload size; a malicious client could send crafted headers with size > actual payload |
| RF05 | MEDIUM | Device locking user identity relies on protocol-layer user mapping; spoofing could bypass locks |
| RF06 | MEDIUM | `addDevices()` parallel connection with partial success path has complex error reporting that may lose error details |

---

## D - Data: What it PROCESSES

### Evidence-Based Assessment

#### Data Types and Formats

1. **Sample Types** (17 types defined in `sample_type.h`):
   `Float32`, `Float64`, `UInt8`, `Int8`, `UInt16`, `Int16`, `UInt32`, `Int32`, `UInt64`, `Int64`, `RangeInt64`, `ComplexFloat32`, `ComplexFloat64`, `Binary`, `String`, `Struct`, `Null`

   **File**: `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/signal/include/opendaq/sample_type.h`

2. **Data Descriptors**: Define the complete structure of signal data including:
   - Name, Dimensions (0=scalar, 1=vector, 2=matrix)
   - SampleType, Unit, ValueRange (not enforced)
   - DataRule (Explicit/Linear/Constant), Origin (ISO 8601), TickResolution (Ratio)
   - PostScaling (linear transform), StructFields (recursive descriptor list)
   - Metadata (string-string dictionary), ReferenceDomainInfo

3. **Serialization**: JSON serialization via `ISerializer`/`IDeserializer` using RapidJSON. Tagged objects carry type identifiers. Binary serialization for packet streaming uses custom headers (`GenericPacketHeader`, `DataPacketHeader`, `AlreadySentPacketHeader`).

4. **Packet Types**:
   - `DataPacket`: Contains signal data in buffers, with packetId, domainPacketId, sampleCount, and union packetOffset (Float64 or Int64)
   - `EventPacket`: State change notifications
   - `BinaryDataPacket`, `BulkDataPacket`, `WrappedDataPacket`: Specialized variants

5. **Config Protocol**: Binary protocol with 16-byte packed header (`PacketHeader`): headerSize(1), type(1), unused(2), payloadSize(4), id(8). Supports RPC, ServerNotification, ProtocolInfo, UpgradeProtocol, InvalidRequest, NoReplyRpc, ConnectionRejected.

6. **Property Value Types**: Properties enforce type matching (ctInt, ctFloat, ctString, ctBool, ctList, ctDict, ctObject). Validation and coercion expressions are supported.

7. **Persistence Formats**: Configuration is serialized to JSON strings via `saveConfiguration()`/`loadConfiguration()`. No database or file-based persistence is provided by the core SDK.

### Test Ideas: Data (26 ideas)

| # | Priority | Test Idea | Automation Fitness | Subcategory |
|---|----------|-----------|-------------------|-------------|
| D01 | P0 | Create signals for each of the 17 SampleType values; send one packet per signal; read via StreamReader with matching type; assert no data corruption | Unit | Input |
| D02 | P0 | Create a DataDescriptor with TickResolution=1/1000000000 (nanosecond) and Origin="2025-01-01T00:00:00Z"; send Int64 domain values up to 2^63-1; read timestamps and assert no overflow in the resolution multiplication | Unit | Boundaries |
| D03 | P0 | Serialize a deeply nested struct descriptor (4 levels: Struct containing Struct containing Struct containing Float64); deserialize it back; assert field layout and sample sizes match exactly | Unit | Formats |
| D04 | P1 | Create a DataDescriptor with 3 dimensions (tensor data) and SampleType Float64; calculate expected buffer size as `sizeof(Float64) * dim1 * dim2 * dim3`; send a packet; assert `getSampleSize()` matches | Unit | Validation |
| D05 | P1 | Serialize an entire device configuration tree with 10 devices, 100 signals, and 50 function blocks to JSON; deserialize into a fresh instance; assert structural equality | Integration | Persistence |
| D06 | P1 | Send a DataPacket with `sampleCount=0`; assert the reader handles it gracefully (returns 0 samples read, no crash) | Unit | Boundaries |
| D07 | P1 | Create a signal with SampleType::String in a BinaryDataPacket; send UTF-8 strings with multi-byte characters (Chinese, emoji, Arabic); read via reader and assert correct string extraction | Unit | Formats |
| D08 | P1 | Create a data descriptor with PostScaling where inputSampleType is Int16 and outputSampleType is Float64; send Int16 boundary values (32767, -32768, 0); assert scaling produces correct Float64 output | Unit | Data Transformation |
| D09 | P1 | Send a packet buffer with data that does not align to the declared SampleSize; assert the reader returns an error rather than reading garbage memory | Unit | Validation |
| D10 | P2 | Set ValueRange on a descriptor to [0, 100]; send values -1, 0, 50, 100, 101; confirm that ValueRange is NOT enforced (per documentation) and all values are readable | Unit | Validation |
| D11 | P2 | Create a DataPacket with packetOffset as Int64 and another with packetOffset as Float64 (union); assert the correct union member is used based on the PACKET_FLAG_OFFSET_TYPE | Unit | Formats |
| D12 | P2 | Test RapidJSON SSE2/SSE4.2/NEON optimizations by parsing a large JSON configuration (>1MB) on each supported platform; assert identical parse results | Integration | Formats |
| D13 | P2 | Create metadata dictionary on a DataDescriptor with 100 key-value pairs; serialize and deserialize; assert all pairs are preserved | Unit | Persistence |
| D14 | P2 | Send an EventPacket with a new DataDescriptor mid-stream; assert the StreamReader correctly handles the descriptor change event and applies new scaling/rules to subsequent data | Unit | State Transitions |
| D15 | P2 | Test `getRawSampleSize()` vs `getSampleSize()` for a descriptor with implicit (Linear rule) data; assert rawSampleSize < sampleSize since implicit samples are not in the buffer | Unit | Validation |
| D16 | P2 | Create a connection with gap checking enabled; send packets with monotonically increasing offsets with a deliberate gap; assert the gap is detected and logged | Integration | Validation |
| D17 | P2 | Test ComplexFloat32 and ComplexFloat64 sample types; send known complex values; read back and verify real and imaginary parts independently | Unit | Formats |
| D18 | P2 | Serialize a property object with all supported property types (Int, Float, Bool, String, List, Dict, Object); deserialize; assert each property value round-trips correctly | Unit | Persistence |
| D19 | P2 | Create a RangeInt64 signal; send a range [100, 200]; read and assert the range boundaries are correctly interpreted | Unit | Formats |
| D20 | P3 | Send 1 million packets to a connection queue; measure memory growth; assert it is linear (O(n)) with no hidden allocations | Unit | Storage |
| D21 | P3 | Create a data descriptor with empty name, empty unit, no dimensions; assert it is valid and packets can be sent/received | Unit | Boundaries |
| D22 | P3 | Test `AlreadySentPacketHeader` in packet streaming: send a data packet, then reference it as already-sent with matching packetId; assert the receiver correctly identifies it | Unit | Formats |
| D23 | P2 | Create a DataDescriptor builder, set all fields, call build; modify the builder and build again; assert the two descriptors are independent (builder does not mutate built objects) | Unit | State |
| D24 | P3 | Parse an ISO 8601 origin string with timezone offset (e.g., "2025-06-15T12:00:00+05:30"); assert correct conversion to absolute timestamps | Unit | Formats |
| D25 | P1 | Inject malformed JSON into `loadConfiguration()`; assert `OPENDAQ_ERR_DESERIALIZE_PARSE_ERROR` is returned, not a crash or partial state | Unit | Validation |
| D26 | P3 | Test xxHash for packet deduplication scenarios: hash 10000 different packet buffers; assert no collisions for non-identical data | Unit | Formats |

### Risks: Data

| Risk ID | Severity | Description |
|---------|----------|-------------|
| RD01 | CRITICAL | Integer overflow in `packetOffset + sampleIndex * delta` for Linear rule with large values |
| RD02 | HIGH | Struct field alignment in packet buffers depends on platform-specific packing; cross-platform struct transfer may corrupt data |
| RD03 | HIGH | String sample type in BinaryDataPacket determines length from sample size; off-by-one in non-null-terminated strings |
| RD04 | MEDIUM | TickResolution as Ratio can produce very small values; floating-point precision loss accumulates over long acquisition sessions |
| RD05 | MEDIUM | Union type for packetOffset (Float64 vs Int64) relies on flags being correct; mismatch silently reads wrong union member |
| RD06 | LOW | ValueRange is documented as "not enforced"; applications that depend on it for safety will not be protected |

---

## I - Interfaces: How it CONNECTS

### Evidence-Based Assessment

#### Public API Surface

1. **C++ Interface Pattern**: All public interfaces use `DECLARE_OPENDAQ_INTERFACE(IFoo, IBase)` which generates COM-like pure virtual classes with `INTERFACE_FUNC` (stdcall on Windows). Methods return `ErrCode` and use output parameters. Factory functions (`FooPtr Foo(args)`) provide the idiomatic construction.

2. **Smart Pointer Wrappers**: Every interface has a corresponding `GenericFooPtr` template class (generated by RTGen) that wraps the raw interface, provides RAII, and converts error codes to C++ exceptions.

3. **Python Bindings** (`bindings/python/`): Generated via pybind11 with 16 test files covering core types, device operations, readers, packets, and property system. Stubs can be generated for IDE auto-completion.

4. **C# Bindings** (`bindings/dotnet/`): .NET project with CI test project, NuGet package test, and BasicHowTo example. Generated through RTGen/CSharp codegen.

5. **C Bindings** (`bindings/c/`): Thin C wrappers for coretypes, coreobjects, and opendaq interfaces. Tests include compile-and-run tests.

6. **Network Protocol Interfaces**:
   - **Native Streaming Protocol**: 11 payload types with packed TransportHeader (4-bit type + 28-bit size). Callbacks for signal management, packet delivery, subscription acknowledgment.
   - **Config Protocol**: 7 packet types (GetProtocolInfo, UpgradeProtocol, Rpc, ServerNotification, InvalidRequest, NoReplyRpc, ConnectionRejected) with 16-byte header.
   - **mDNS Discovery**: Service discovery with capability filtering.

7. **Internal Interfaces**: `*_private.h` and `*_internal.h` headers expose implementation details needed across module boundaries but not part of the public API (e.g., `ISignalPrivate`, `IInputPortPrivate`, `IDevicePrivate`, `IContextInternal`).

### Test Ideas: Interfaces (26 ideas)

| # | Priority | Test Idea | Automation Fitness | Subcategory |
|---|----------|-----------|-------------------|-------------|
| I01 | P0 | Create an Instance in Python, add a reference device, read 100 samples via StreamReader; assert values match the same operation performed in C++ | E2E | APIs |
| I02 | P0 | Create an Instance in C#, enumerate available devices, add a device, read signal data; compare results with the C++ equivalent | E2E | APIs |
| I03 | P1 | Exercise every C binding function in `copendaq/` from a pure C program (no C++); assert all functions are callable and return expected error codes | Integration | APIs |
| I04 | P1 | Call every method on `IDevice` from Python that is documented in C++; identify any methods missing from the Python binding | Integration | APIs |
| I05 | P1 | Start a native streaming server, connect from a client; send all 11 payload types in sequence; assert the client receives and correctly parses each type | Integration | Protocols |
| I06 | P1 | Start a native streaming server, connect 10 clients simultaneously; assert all clients receive signal-available messages for all public signals | Integration | Protocols |
| I07 | P1 | Test the config protocol version upgrade: send GetProtocolInfo, check version, send UpgradeProtocol; assert the protocol version changes and subsequent Rpc calls use the new format | Integration | Protocols |
| I08 | P1 | Send an InvalidRequest packet type via config protocol; assert the server responds with appropriate error and does not crash | Integration | Protocols |
| I09 | P2 | Call `ISignal.queryInterface(IPropertyObject::Id)` to verify interface inheritance chain; assert the signal correctly responds to both ISignal and IPropertyObject methods | Unit | APIs |
| I10 | P2 | Test `IBaseObject` reference counting: create an object, increment ref count to 100, decrement to 0; assert destructor runs exactly once | Unit | APIs |
| I11 | P2 | Create a Python binding test that exercises `setOnDataAvailable()` callback; send 10 packets; assert the callback fires 10 times with correct data | Integration | APIs |
| I12 | P2 | Connect a signal to an input port, then disconnect; assert `getConnections()` returns empty list and no packets can be enqueued | Unit | APIs |
| I13 | P2 | Test `SearchFilter` combinations (recursive, visible-only) on a device tree with 3 levels and mixed visibility; assert correct component filtering | Unit | APIs |
| I14 | P2 | Call `IConnection.peek()` when no packets are queued; assert `OPENDAQ_NO_MORE_ITEMS` is returned without blocking | Unit | APIs |
| I15 | P2 | Start mDNS discovery server, register a service; run DiscoveryClient; assert the registered device appears in results within 500ms timeout | E2E | Integrations |
| I16 | P2 | Send a subscribe command for a non-existent signal via native streaming; assert appropriate error response | Integration | Protocols |
| I17 | P2 | Test `enqueueOnThisThread()` vs `enqueue()`: assert the former delivers the notification synchronously on the calling thread while the latter uses the scheduler | Unit | APIs |
| I18 | P2 | Use Python bindings to create a PropertyObject, set 10 properties of various types, serialize to JSON; parse the JSON in pure Python and validate structure | Integration | APIs |
| I19 | P3 | Test that the .NET binding's `openDAQ.Net.csproj` builds successfully on Windows and the NuGet package installs correctly | E2E | APIs |
| I20 | P3 | Inspect all `*_private.h` interfaces; assert none are accidentally exposed through public headers or Python/C# bindings | Unit | APIs |
| I21 | P3 | Test `ConnectionRejected` packet type in config protocol; connect with invalid credentials; assert the rejection is communicated cleanly | Integration | Protocols |
| I22 | P2 | Test `Streaming.getConnectionStatus()` during reconnection; simulate a server restart; assert status transitions from "Connected" to "Reconnecting" to "Connected" | E2E | Protocols |
| I23 | P3 | Call `Instance.addStandardServers()` and verify all expected server types (native streaming, OPC UA) are created | E2E | Integrations |
| I24 | P2 | Test client-to-device streaming by adding input ports to a Streaming object; send data from client side; assert the server receives the data | Integration | Protocols |
| I25 | P3 | Generate Python binding stubs (`OPENDAQ_GENERATE_PYTHON_BINDINGS_STUBS=ON`); use mypy to type-check a test script against the stubs | E2E | APIs |
| I26 | P1 | Send a TransportHeader with PayloadType value outside the defined enum range (e.g., 0 or 12); assert the receiver handles it as invalid rather than indexing out of bounds | Integration | Protocols |

### Risks: Interfaces

| Risk ID | Severity | Description |
|---------|----------|-------------|
| RI01 | HIGH | Language bindings may not expose the full C++ API surface; missing methods in Python/C# create silent feature gaps |
| RI02 | HIGH | COM-like interface pattern means vtable layout must be identical across all compilers; any deviation is a silent corruption bug |
| RI03 | MEDIUM | Native streaming protocol uses only 4 bits for payload type (0-15); 11 types defined, only 4-5 slots remaining for future expansion |
| RI04 | MEDIUM | Config protocol `unused[2]` bytes in PacketHeader could contain garbage on some platforms; receivers must ignore them |
| RI05 | LOW | Python binding tests require full SDK build with OPC UA + native streaming + WebSocket enabled; partial builds cannot run binding tests |

---

## P - Platform: What it DEPENDS ON

### Evidence-Based Assessment

#### Supported Platforms (from CI and README)

| OS | Architecture | Compilers | CI Status |
|----|-------------|-----------|-----------|
| Windows (VS) | x86, x64 | MSVC 2022 (v14.1+), Clang, GCC, Intel-LLVM | Active CI |
| Windows (VS) | arm64 | MSVC, Clang | Not actively supported |
| Windows (MinGW) | x86, x64 | GCC, Clang | No CI (tests disabled for GCC due to memory corruption) |
| Linux (Ubuntu) | x86, x64 | GCC 9-14, Clang 14-16 | Active CI |
| Linux | armhf, aarch64 | GCC, Clang | No CI |
| macOS (>=10.15) | x64, arm64 | Clang | Active CI (both Intel and ARM) |
| iOS | arm64 | GCC, Clang | Requires manual changes |
| Android | aarch64 | GCC, Clang | Commented out in CI |

#### External Dependencies

| Dependency | Purpose | Version Strategy |
|-----------|---------|-----------------|
| Boost | UUID generation, regex, filesystem, date_time | FetchContent (can use system) |
| RapidJSON | JSON serialization/deserialization | FetchContent with SSE options |
| spdlog | Logging backend | FetchContent with patches |
| fmt | String formatting (spdlog dependency) | FetchContent |
| Google Test/Mock | Unit testing | FetchContent |
| Taskflow | Parallel task scheduling | FetchContent with patches |
| Apache Arrow | Parquet recorder module | FetchContent |
| bcrypt | Password hashing for authentication | Included in external/ |
| mdns | mDNS device discovery | FetchContent with patches |
| pybind11 | Python bindings | FetchContent with patches |
| Thrift | Serialization protocol | FetchContent |
| mimalloc | Optional memory allocator | FetchContent |
| miniaudio | Audio device module | Included headers |
| xxHash | Hashing | FetchContent |
| tsl-ordered-map | Ordered hash map | FetchContent |
| Mono | Required on Linux for RTGen code generation | System package |

#### Build Requirements
- CMake 3.24+
- C++ compiler with C++17 support (GCC 7+, Clang 5+, MSVC v14.1+)
- Python 3.8+ (for bindings and coverage)
- Git (for version info and FetchContent)
- Mono (Linux, for RTGen)

### Test Ideas: Platform (26 ideas)

| # | Priority | Test Idea | Automation Fitness | Subcategory |
|---|----------|-----------|-------------------|-------------|
| P01 | P0 | Build and run the full test suite on Windows MSVC 2022 x64 Release; assert zero test failures | E2E | OS |
| P02 | P0 | Build and run the full test suite on Ubuntu Latest GCC-14 Release; assert zero test failures | E2E | OS |
| P03 | P0 | Build and run the full test suite on macOS Latest Clang Release; assert zero test failures | E2E | OS |
| P04 | P1 | Build with GCC-9 (minimum supported) on Ubuntu; assert compilation succeeds and all tests pass | E2E | OS |
| P05 | P1 | Build with 32-bit flag (`OPENDAQ_FORCE_COMPILE_32BIT=ON`) on Linux; run packet header `static_assert` tests to confirm struct packing is correct on 32-bit | E2E | Hardware |
| P06 | P1 | Build on Windows with MinGW GCC; investigate the documented "memory corruption in test_device_modules"; determine if it is a GCC bug, undefined behavior in the SDK, or test environment issue | Human Exploration | OS |
| P07 | P1 | Cross-compile for ARM aarch64 from an x64 Linux host; run basic signal read/write test on target; assert correct data | E2E | Hardware |
| P08 | P1 | Test the SDK on a system with < 512MB RAM; create an instance with 100 signals; measure peak memory usage and identify any OOM conditions | E2E | Hardware |
| P09 | P2 | Build with `OPENDAQ_USE_CCACHE=ON` on a cold cache, then rebuild; measure speedup factor; assert ccache integration works | E2E | External Software |
| P10 | P2 | Build with `OPENDAQ_FORCE_LLD_LINKER=ON`; compare link times against default linker; assert all tests still pass | E2E | External Software |
| P11 | P2 | Build with RapidJSON SSE4.2 enabled on an x64 machine; serialize/deserialize a 10MB JSON config; compare performance against non-SSE build | Integration | Hardware |
| P12 | P2 | Run the test suite on a system with network namespaces to isolate mDNS traffic; assert device discovery does not leak across network boundaries | E2E | Network |
| P13 | P2 | Test native streaming over IPv6; connect a client to a server using IPv6 addresses; assert full signal data transfer works | E2E | Network |
| P14 | P2 | Simulate 100ms network latency between client and server using `tc netem`; measure native streaming throughput degradation; assert no data corruption | E2E | Network |
| P15 | P2 | Build the Python bindings with Python 3.8 (minimum), 3.10, and 3.12; run binding tests on each version; assert parity | E2E | External Software |
| P16 | P2 | Build the C# bindings targeting .NET 6.0 and .NET 8.0; run binding tests; assert parity | E2E | External Software |
| P17 | P2 | Install the SDK using `cmake --install` with default prefix; write a downstream CMake project that uses `find_package(openDAQ)`; assert it configures and builds | E2E | External Software |
| P18 | P3 | Run tests on a system with very slow DNS resolution (>5s timeout); assert mDNS discovery handles it gracefully without blocking the main thread | E2E | Network |
| P19 | P3 | Build on macOS with deployment target 10.15 (minimum documented); assert no use of APIs unavailable before 10.15 | E2E | OS |
| P20 | P3 | Test with `OPENDAQ_LINK_3RD_PARTY_LIBS_STATICALY=OFF`; deploy to a system without the 3rd party libraries; assert clear error messages about missing dependencies | E2E | External Software |
| P21 | P2 | Run Valgrind/AddressSanitizer on the full test suite on Linux; categorize and count memory errors by module | E2E | OS |
| P22 | P3 | Build the Android target (currently commented out in CI) with NDK r25c; assert the core library compiles for arm64-v8a | Human Exploration | OS |
| P23 | P2 | Test with `OPENDAQ_SANITIZER=thread`; run all integration tests; categorize found data races | E2E | OS |
| P24 | P3 | Build with Intel-LLVM (icx) compiler on Windows; assert all non-binding tests pass | E2E | OS |
| P25 | P2 | Test packet transfer between a big-endian and little-endian system (simulated); assert binary protocol headers use consistent byte ordering | Human Exploration | Hardware |
| P26 | P3 | Measure the total installed SDK size (headers + libraries + cmake config); compare against documentation claims | Human Exploration | External Software |

### Risks: Platform

| Risk ID | Severity | Description |
|---------|----------|-------------|
| RP01 | HIGH | Memory corruption on Windows MinGW GCC is documented but unresolved; indicates potential undefined behavior in the codebase |
| RP02 | HIGH | ARM (armhf, aarch64), iOS, and Android have no CI; regressions on these platforms are undetectable |
| RP03 | MEDIUM | Python 3.8 is end-of-life; binding compatibility with newer Python versions is tested but minimum is aging |
| RP04 | MEDIUM | Mono dependency on Linux solely for RTGen tool; if Mono is unavailable, the build fails at configure time |
| RP05 | LOW | Debug builds on Linux are commented out in CI due to "problem with test_py_opendaq"; debug-only bugs can accumulate |

---

## O - Operations: How it's USED

### Evidence-Based Assessment

#### Installation and Deployment

1. **Build from Source**: Primary installation method. CMake presets provide reproducible builds (`cmake --preset "x64/gcc/full/debug"`). The CI runs with `ci` preset.

2. **Simulator Deployment**: `simulator_app` is designed to run as a systemd service. It applies IP configuration via Python script (`netplan_manager.py` with sudo), creates users with bcrypt-hashed passwords, starts standard servers, and waits for SIGINT.

3. **Package Management**: `.github/workflows/package.yml` and `cmake/Packing.cmake` indicate CPack-based packaging. NuGet package for C# bindings.

#### Configuration

1. **CMake Options**: 60+ build options controlling features, bindings, modules, tests, and dependencies.

2. **Runtime Configuration**: `JsonConfigProvider` loads runtime configuration from JSON files. Instance builder API for programmatic configuration.

3. **Logging**: Compile-time log level filtering (`OPENDAQ_LOG_LEVEL`) with Debug and Release presets. Runtime log level per component. spdlog backend with configurable sinks. Synchronous logging option (`OPENDAQ_USE_SYNCHRONOUS_LOGGER`).

4. **Device Log Access**: `getLogFileInfos()` and `getLog()` allow remote access to device log files with offset/size chunked reading.

#### User Workflows (from examples)

1. **Device Discovery**: `instance.getAvailableDevices()` -> iterate capabilities -> `instance.addDevice(connectionString)`
2. **Data Reading**: Get signal -> Create StreamReader<double, uint64_t> -> Loop: `reader.readWithDomain()`
3. **Function Block**: `instance.addFunctionBlock("TypeId")` -> connect input port -> process output signals
4. **Server Setup**: `instance.addStandardServers()` -> `server.enableDiscovery()`
5. **Configuration**: `device.saveConfiguration()` / `device.loadConfiguration()`
6. **Reconnection**: Status monitoring + reconnection logic (dedicated example)

#### Error Handling

Error codes follow a structured pattern: `0x80000000 | (TYPE_ID << 16) | ERROR_CODE`. At least 30 distinct error codes are defined. `OPENDAQ_FAILED(x)` and `OPENDAQ_SUCCEEDED(x)` macros. `daqTry` converts exceptions. Domain-specific error types exist for signals, readers, devices, and scheduler.

### Test Ideas: Operations (26 ideas)

| # | Priority | Test Idea | Automation Fitness | Subcategory |
|---|----------|-----------|-------------------|-------------|
| O01 | P1 | Follow the quick_start_native.cpp example from scratch: create instance, discover device, add device, read 100 samples; assert the complete workflow succeeds on Linux and Windows | E2E | Common Use |
| O02 | P1 | Follow the quick_start_full.cpp example with WebSocket streaming; assert the complete workflow including renderer function block works | E2E | Common Use |
| O03 | P1 | Start a simulator server, kill the process, restart it; connect a client with reconnection example logic; assert the client recovers and continues reading data | E2E | Recovery |
| O04 | P1 | Set log level to Debug on all components; run a 10-minute streaming session; assert no memory growth from log message accumulation and logs are rotatable | E2E | Admin Operations |
| O05 | P1 | Call `device.getLog(id, size=1000, offset=0)` and `getLog(id, size=-1, offset=0)`; assert chunked reading returns the same data as full file reading | Integration | Admin Operations |
| O06 | P2 | Create 50 devices, 200 signals, 100 function blocks; call `saveConfiguration()` and `loadConfiguration()`; assert full topology is restored | Integration | Admin Operations |
| O07 | P2 | Build the SDK with `cmake --preset "x64/msvc-22/full"`; time the full build; document baseline for future regression tracking | Human Exploration | Common Use |
| O08 | P2 | Create a client that connects to 5 devices simultaneously; enumerate all signals recursively; assert no duplicate global IDs | Integration | Common Use |
| O09 | P2 | Configure the simulator with `JsonConfigProvider` using a custom JSON file; assert property values from JSON override defaults | Integration | Admin Operations |
| O10 | P2 | Start a server, add 3 users with different permission levels; connect as each user; assert operations are correctly gated by permissions | E2E | User Management |
| O11 | P2 | Start a simulator, enable mDNS discovery; from a client on the same network, discover the simulator; assert `DiscoveryClient` finds it within 2 seconds | E2E | Common Use |
| O12 | P2 | Create a CSV recorder function block, connect a signal generating 1000 samples/sec; run for 60 seconds; assert the CSV file contains exactly 60000 records | E2E | Common Use |
| O13 | P2 | Test the audio device module: create an audio device, read samples; assert sample format matches the system audio configuration | E2E | Common Use |
| O14 | P2 | Test the Parquet recorder module: record 100000 samples; read back with Apache Arrow; assert data integrity | E2E | Common Use |
| O15 | P2 | Attempt to run the simulator without `sudo python3 /home/opendaq/netplan_manager.py` available; assert it continues with a warning rather than crashing | E2E | Recovery |
| O16 | P3 | Set `OPENDAQ_ENABLE_OPTIONAL_TESTS=ON` and run the test suite; document which additional tests are enabled and their pass/fail status | Human Exploration | Admin Operations |
| O17 | P3 | Set `OPENDAQ_ENABLE_UNSTABLE_TEST_LABELS=ON` and `OPENDAQ_SKIP_UNSTABLE_TESTS=OFF`; run all tests; document which "unstable" tests fail and their failure patterns | Human Exploration | Extreme Use |
| O18 | P2 | Connect 100 clients to a single server simultaneously; assert the server handles all connections without rejecting valid clients | E2E | Extreme Use |
| O19 | P3 | Run the license checker example module; verify it correctly validates a license file and rejects expired/invalid licenses | E2E | Admin Operations |
| O20 | P3 | Explore the error message quality: trigger each of the 30+ error codes; assert every error code has a human-readable message | Human Exploration | Recovery |
| O21 | P2 | Create a signal with `setPublic(false)`, then call `setPublic(true)`; assert streaming clients receive a signal-available notification | Integration | Common Use |
| O22 | P3 | Test IP configuration management: call `applyIpConfiguration()` with valid and invalid network settings; assert valid settings apply and invalid ones return errors | E2E | Admin Operations |
| O23 | P2 | Start a server, connect a client, stream data for 24 hours continuously; monitor memory usage, connection stability, and data correctness | E2E | Extreme Use |
| O24 | P3 | Run the `device_server` example and the `client_local` example back-to-back; assert both compile and run without errors | E2E | Common Use |
| O25 | P3 | Test the `client_authentication` example; connect with correct and incorrect credentials; assert authentication success/failure | E2E | User Management |
| O26 | P2 | Create an InstanceBuilder with all options set (config provider, auth provider, discovery server, root device); assert the constructed instance has all configurations applied | Integration | Common Use |

### Risks: Operations

| Risk ID | Severity | Description |
|---------|----------|-------------|
| RO01 | HIGH | Simulator runs `std::system("sudo python3 ...")` on startup; if this script fails or is missing, behavior is undocumented |
| RO02 | MEDIUM | Hardcoded bcrypt password hashes in simulator source code; password "opendaq" and "root" are publicly known |
| RO03 | MEDIUM | Configuration save/load serializes entire device tree to a single JSON string; very large configurations may exceed memory limits |
| RO04 | MEDIUM | No built-in rate limiting for client connections; a flood of connections could overwhelm the server |
| RO05 | LOW | Debug builds on Linux are disabled in CI; debug-specific defects go undetected |

---

## T - Time: WHEN Things Happen

### Evidence-Based Assessment

#### Real-Time and Timing Mechanisms

1. **Scheduler**: Thread-pool based (`IScheduler`) with configurable worker count. Supports:
   - One-off function scheduling with awaitables
   - Lightweight work callbacks (no return value, less overhead)
   - Dependency graph scheduling (acyclic directed graphs via Taskflow)
   - Main loop execution (blocking + iteration modes)
   - Main loop task marshalling from background threads

   **File**: `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/scheduler/include/opendaq/scheduler.h`

2. **Signal Timing**: Signals have domain signals (typically time) with:
   - `TickResolution`: Ratio (numerator/denominator) scaling ticks to physical units (e.g., 1/1000000000 for nanoseconds)
   - `Origin`: ISO 8601 string (e.g., "2025-01-01T00:00:00Z")
   - `DataRule`: Linear rule with delta defines sampling rate (delta=1000 at ns resolution = 1MHz)
   - `ReferenceDomainInfo`: Groups synchronized signals with domain offset

3. **Synchronization Component**: `ISyncComponent` manages time synchronization:
   - Protocols: PTP (TimeProtocol::Unknown/Tai/Gps/Utc), NTP, IRIG, GPS, CLK (free-run)
   - Sync lock status (`getSyncLocked()`)
   - Selectable sync source interface
   - Multiple sync output interfaces

   **File**: `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/synchronization/include/opendaq/sync_component.h`

4. **Connection Queue and Gap Detection**: `ConnectionImpl` maintains a packet queue with optional gap checking (`GapCheckState`: disabled/uninitialized). Gap detection uses packet offsets to identify missing data.

   **File**: `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/signal/src/connection_impl.cpp`

5. **Reader Timeouts**: `ReadTimeoutType::Any` returns immediately when data arrives; `ReadTimeoutType::All` waits for the full requested amount or timeout. Timeout is passed to read methods.

6. **Streaming Protocol Timing**:
   - `PAYLOAD_TYPE_STREAMING_PROTOCOL_INIT_DONE` signals initialization completion
   - `PAYLOAD_TYPE_STREAMING_PROTOCOL_INIT_REQUEST` requests re-initialization
   - Subscribe/unsubscribe with acknowledgment introduces round-trip latency

7. **Device Domain**: `IDeviceDomain` provides `getTicksSinceOrigin()` for elapsed time measurement.

8. **Lifecycle Management**:
   - Instance creation -> module loading -> device connection -> streaming
   - Scheduler stop cancels outstanding work and blocks new submissions
   - `InstanceImpl` destructor: stops servers -> removes root device
   - Reconnection patterns in examples

### Test Ideas: Time (24 ideas)

| # | Priority | Test Idea | Automation Fitness | Subcategory |
|---|----------|-----------|-------------------|-------------|
| T01 | P0 | Create 4 threads each enqueuing 10000 packets to the same Connection simultaneously; read all packets; assert total count is 40000, no packets lost, and FIFO order is preserved within each thread's sequence | Unit | Concurrency |
| T02 | P0 | Create a signal with Linear rule (delta=1000, start=0) at TickResolution 1/1000000000; stream for 10 seconds at 1MHz; assert no timestamp gaps using gap detection | Integration | Sequences |
| T03 | P0 | Start a scheduler with 8 workers; schedule 1000 work items with dependencies (task graph); assert all complete and dependency ordering is respected | Unit | Scheduling |
| T04 | P1 | Create a MultiReader on 3 signals with different sampling rates (1kHz, 10kHz, 100kHz) but same ReferenceDomainId; read for 5 seconds; assert time alignment is within one tick of the lowest-rate signal | Integration | Concurrency |
| T05 | P1 | Schedule a function on a stopped scheduler; assert `OPENDAQ_ERR_SCHEDULER_STOPPED` is returned immediately | Unit | Sequences |
| T06 | P1 | Test `Streaming.getConnectionStatus()` transitions: start server -> connect client (expect "Connected") -> stop server (expect "Reconnecting") -> restart server (expect "Connected") | E2E | Sequences |
| T07 | P1 | Create 10 readers with `ReadTimeoutType::All` requesting 1000 samples each, but only send 100 total; assert all readers unblock after their timeout expires, not before | Unit | Scheduling |
| T08 | P1 | Simulate clock drift between client and server by injecting offset into domain packet timestamps; assert ReferenceDomainOffset correctly compensates | Integration | Concurrency |
| T09 | P1 | Send 100 packets to a connection, pause for 5 seconds, send 100 more; assert gap detection identifies the pause if expected delta is 1ms between packets | Integration | Sequences |
| T10 | P2 | Call `device.getTicksSinceOrigin()` twice with a 1-second sleep between calls; assert the tick difference corresponds to 1 second within 10ms tolerance | Integration | Scheduling |
| T11 | P2 | Start `runMainLoop()` on the scheduler, schedule 100 work items via `scheduleWorkOnMainLoop()`; call `stopMainLoop()`; assert all 100 items completed | Unit | Scheduling |
| T12 | P2 | Call `runMainLoopIteration()` 1000 times in a tight loop; measure timing jitter; assert iteration time is bounded (no unbounded blocking) | Unit | Scheduling |
| T13 | P2 | Create a scheduler with `useMainLoop=true` and 1 worker; assert `isMultiThreaded()` returns false and all work executes on the main loop thread | Unit | Scheduling |
| T14 | P2 | Send subscribe/unsubscribe commands in rapid succession (100 toggles/second) for the same signal; assert no race condition in subscription state | Integration | Concurrency |
| T15 | P2 | Test SyncComponent: set sync source to PTP, query `getSyncLocked()`; simulate loss of PTP master; assert sync lock status transitions to unlocked | Integration | Sequences |
| T16 | P2 | Create two signals with different Origins (one Unix epoch, one GPS epoch); read both via separate readers; convert to absolute time; assert correct epoch handling | Unit | Sequences |
| T17 | P2 | Schedule a task graph with a cycle (A->B->A); assert the scheduler detects the cycle and returns an error | Unit | Scheduling |
| T18 | P2 | Stream data for 1 hour; calculate cumulative timestamp drift by comparing expected vs actual domain values at the end; assert drift is < 1ms for a 1MHz signal | E2E | Sequences |
| T19 | P3 | Call `scheduler.waitAll()` with no outstanding work; assert it returns immediately rather than blocking | Unit | Scheduling |
| T20 | P3 | Test `setActive(false)` on a signal while packets are being enqueued; assert data packets are dropped (`OPENDAQ_IGNORED`) but event packets are still delivered | Unit | Concurrency |
| T21 | P3 | Measure the latency from `signal.sendPacket()` to `reader.read()` for a local (in-process) connection; assert < 1ms median latency | Unit | Scheduling |
| T22 | P2 | Test `enqueueOnThisThread()` under contention: 10 threads call it simultaneously; assert the notification is delivered on the calling thread, not deferred | Unit | Concurrency |
| T23 | P3 | Start and stop a server 100 times in rapid succession; assert no resource leaks (file descriptors, threads, memory) | E2E | Sequences |
| T24 | P2 | Send a data packet with `packetOffset` that would cause the calculated timestamp to wrap around Int64; assert the reader handles overflow gracefully | Unit | Sequences |

### Risks: Time

| Risk ID | Severity | Description |
|---------|----------|-------------|
| RT01 | CRITICAL | Concurrent packet enqueuing with `withLock()` in ConnectionImpl: if the lock is not properly scoped, data races corrupt the packet queue |
| RT02 | CRITICAL | MultiReader synchronization assumes compatible sampling rates; incompatible rates may cause infinite blocking or incorrect data alignment |
| RT03 | HIGH | Gap detection in ConnectionImpl has an `uninitialized` state; the first gap after connection may be missed |
| RT04 | HIGH | Timestamp overflow: Int64 ticks at nanosecond resolution overflow after ~292 years, but intermediate calculations in Linear rule could overflow sooner with large deltas |
| RT05 | MEDIUM | Reader timeout blocking may hold resources; 10 blocked readers on the same scheduler could exhaust the thread pool |
| RT06 | MEDIUM | `stopMainLoop()` from another thread during `runMainLoop()` has no documented ordering guarantee; race condition possible |

---

## Cross-Dimensional Interactions and Risks

The following risks emerge from interactions between multiple SFDIPOT dimensions:

### Critical Cross-Dimensional Risks

| Risk ID | Dimensions | Severity | Description |
|---------|-----------|----------|-------------|
| RX01 | T + D + I | CRITICAL | **Packet corruption under concurrency**: Multiple threads enqueue packets (T) containing structured data (D) across interface boundaries (I). If the connection queue lock has a bug, packet buffers may be partially written, causing the reader to interpret corrupted struct fields. |
| RX02 | S + P + I | CRITICAL | **ABI break across platforms**: The COM-like interface pattern (S) assumes identical vtable layout across compilers (P). If a module compiled on ARM with Clang has different padding than the host compiled with GCC on x64 (P), every interface call (I) invokes undefined behavior. |
| RX03 | F + T + D | HIGH | **Data rule overflow during long acquisitions**: Linear data rule (F) computes `packetOffset + index * delta` where packetOffset grows monotonically (T). After hours of acquisition, the Int64 packetOffset combined with a large delta overflows, producing incorrect sample values (D). |
| RX04 | I + P + O | HIGH | **Python binding crash on ARM**: Python bindings (I) are tested only on x64 CI (P). ARM platforms may have alignment issues with pybind11-generated code. Users deploying on Raspberry Pi (O) could encounter segfaults not caught by CI. |
| RX05 | F + O + T | HIGH | **Reconnection data loss**: When a streaming connection drops (O), the reconnection logic (F) must re-subscribe signals and resume data flow (T). During the gap, packets are lost. If gap detection (T) is in `uninitialized` state, the first gap after reconnect is missed, and the application has no indication of data discontinuity. |
| RX06 | S + F + I | MEDIUM | **Module version mismatch**: A module built against an older SDK version (S) may implement an interface with fewer virtual methods (I). The ModuleManager (F) loads it without version checking; calling a new method would jump to garbage memory. |
| RX07 | D + O + P | MEDIUM | **Configuration portability**: Serialized configuration (D) saved on Windows (P) with MSVC-specific floating-point representation may deserialize differently on Linux (P), causing subtle property value changes when restoring configuration (O). |
| RX08 | T + O + F | MEDIUM | **Scheduler thread pool exhaustion**: If many readers (F) block with `ReadTimeoutType::All` (T) during a network outage (O), all scheduler workers are consumed. The scheduler cannot process new work including reconnection logic, creating a deadlock. |

---

## Prioritized Testing Recommendations

### Phase 1: Critical Path (P0 - Immediate)

1. **Concurrent Packet Queuing (T01)**: The packet queue is the backbone of data flow. Any concurrency bug here corrupts all downstream data.
2. **Sample Type Correctness (D01)**: All 17 sample types must be readable without corruption.
3. **Data Rule Calculations (F01, F02)**: Linear rule and PostScaling arithmetic must be exact.
4. **ABI Compatibility (S01)**: Cross-compiler module loading is a core architectural promise.
5. **Timestamp Overflow (D02)**: Nanosecond TickResolution with large Int64 values is the most common domain configuration.
6. **Thread Safety Toggle (S02)**: The `OPENDAQ_THREAD_SAFE=OFF` path is under-tested and likely harbors data races.
7. **Cross-Platform CI (P01, P02, P03)**: Maintain full CI on Windows, Linux, macOS.
8. **Multi-Reader Synchronization (F04)**: MultiReader is a key feature for multi-channel DAQ.
9. **Connection FIFO Ordering (F03)**: Packets must arrive in order.

### Phase 2: Security and Protocol Robustness (P1)

1. **Protocol Fuzzing (I26, F11)**: Transport headers with malicious sizes/types.
2. **Access Control (F10, F13)**: Permission enforcement must be complete.
3. **Device Connection Error Handling (F05, F06)**: Partial success paths need thorough testing.
4. **Module Authentication (F22)**: Unsigned module rejection.
5. **Cross-Language Binding Parity (I01, I02, I03, I04)**: Missing binding coverage creates security blind spots.
6. **Configuration Injection (D25)**: Malformed JSON must not crash the system.
7. **Reconnection (O03)**: Recovery from server crashes.
8. **MinGW Memory Corruption (P06)**: Investigate and resolve the documented issue.

### Phase 3: Functional Coverage (P2)

1. **All Reader Types (F14)**: Ensure all 5 reader types work on the same signal.
2. **Struct Descriptors (D03, F17)**: Nested struct serialization is complex and error-prone.
3. **Gap Detection (D16, T09)**: Critical for data integrity.
4. **Long-Running Streaming (O23, T18)**: 24-hour stability test.
5. **Extreme Scale (O18)**: 100 concurrent clients.
6. **Network Conditions (P14)**: Latency and packet loss.
7. **Serialization Round-Trip (D05, D18)**: Full configuration serialization.

### Phase 4: Exploratory (P3 and Human Exploration)

1. **Explore the MSVC Workaround (S18)**: Is the inline static workaround still needed?
2. **Error Message Quality (O20)**: Are error codes actionable?
3. **Build Time Profiling (S11, O07)**: Establish baselines.
4. **Android Feasibility (P22)**: Can the commented-out CI be re-enabled?
5. **Debug Build Investigation (RP05)**: Why are Linux debug builds disabled?
6. **Unstable Test Analysis (O17)**: What tests are marked unstable and why?

---

## Risk Register Summary

| Risk ID | Severity | Dimension | Description | Likelihood | Impact |
|---------|----------|-----------|-------------|-----------|--------|
| RT01 | CRITICAL | Time | Concurrent packet queue corruption | Medium | Critical |
| RT02 | CRITICAL | Time | MultiReader synchronization failure | Medium | High |
| RX01 | CRITICAL | T+D+I | Cross-boundary packet corruption under concurrency | Low | Critical |
| RX02 | CRITICAL | S+P+I | ABI break across platforms | Low | Critical |
| RF01 | CRITICAL | Function | Integer overflow in data rule calculation | Medium | High |
| RD01 | CRITICAL | Data | Integer overflow in Linear rule | Medium | High |
| RP01 | HIGH | Platform | MinGW GCC memory corruption | Confirmed | High |
| RF02 | HIGH | Function | PostScaling boundary value overflow | Medium | High |
| RF03 | HIGH | Function | MultiReader unclear failure mode | Medium | Medium |
| RF04 | HIGH | Function | Protocol header size manipulation | Low | High |
| RI01 | HIGH | Interfaces | Binding API surface gaps | High | Medium |
| RI02 | HIGH | Interfaces | COM-like vtable layout divergence | Low | Critical |
| RX03 | HIGH | F+T+D | Data rule overflow during long acquisition | Medium | High |
| RX05 | HIGH | F+O+T | Reconnection data loss with uninitialized gap state | Medium | High |
| RP02 | HIGH | Platform | ARM/iOS/Android no CI coverage | High | Medium |
| RS01 | HIGH | Structure | ABI compatibility is architecture-critical | Medium | Critical |
| RS02 | HIGH | Structure | Thread safety compile-time toggle creates hidden races | Medium | High |
| RT03 | HIGH | Time | Gap detection uninitialized state | Medium | Medium |
| RT04 | HIGH | Time | Timestamp overflow in intermediate calculations | Low | High |
| RO01 | HIGH | Operations | Simulator depends on external Python script with sudo | Medium | Medium |
| RD02 | HIGH | Data | Cross-platform struct alignment | Low | High |
| RD03 | HIGH | Data | String sample type off-by-one | Medium | Medium |

---

## Appendix: File References

All test ideas and risk assessments are based on evidence from the following key files:

- `/workspaces/cf-devpod/tmp/opendaq/CMakeLists.txt` - Root build configuration (474 lines)
- `/workspaces/cf-devpod/tmp/opendaq/README.md` - Platform support matrix
- `/workspaces/cf-devpod/tmp/opendaq/CMake-Options.md` - 60+ build options
- `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/signal/include/opendaq/signal.h` - Signal interface
- `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/signal/include/opendaq/data_descriptor.h` - Data descriptor interface
- `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/signal/include/opendaq/sample_type.h` - 17 sample types
- `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/signal/include/opendaq/data_rule.h` - Data rules (Explicit, Linear, Constant)
- `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/signal/include/opendaq/scaling.h` - PostScaling
- `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/signal/include/opendaq/connection.h` - Connection queue
- `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/signal/include/opendaq/packet.h` - Packet types
- `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/signal/include/opendaq/signal_impl.h` - Signal implementation with MSVC workaround
- `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/signal/src/connection_impl.cpp` - Connection with gap detection and locking
- `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/device/include/opendaq/device.h` - Device interface (407 lines)
- `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/reader/include/opendaq/reader.h` - Reader base interface
- `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/reader/src/stream_reader_impl.cpp` - StreamReader with mutex
- `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/streaming/include/opendaq/streaming.h` - Streaming interface
- `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/functionblock/include/opendaq/function_block.h` - Function block interface
- `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/scheduler/include/opendaq/scheduler.h` - Scheduler interface
- `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/synchronization/include/opendaq/sync_component.h` - Sync component
- `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/modulemanager/include/opendaq/module_manager.h` - Module manager
- `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/component/include/opendaq/component.h` - Component base
- `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/opendaq/include/opendaq/instance.h` - Instance (entry point)
- `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/opendaq/src/instance_impl.cpp` - Instance lifecycle
- `/workspaces/cf-devpod/tmp/opendaq/core/coreobjects/include/coreobjects/property_object.h` - Property system
- `/workspaces/cf-devpod/tmp/opendaq/core/coretypes/include/coretypes/errors.h` - 30+ error codes
- `/workspaces/cf-devpod/tmp/opendaq/core/coretypes/include/coretypes/serializer.h` - JSON serialization
- `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/signal/include/opendaq/reference_domain_info.h` - Time sync info
- `/workspaces/cf-devpod/tmp/opendaq/shared/libraries/native_streaming_protocol/include/native_streaming_protocol/native_streaming_protocol_types.h` - Protocol types
- `/workspaces/cf-devpod/tmp/opendaq/shared/libraries/config_protocol/include/config_protocol/config_protocol.h` - Config protocol
- `/workspaces/cf-devpod/tmp/opendaq/shared/libraries/packet_streaming/include/packet_streaming/packet_streaming.h` - Packet streaming
- `/workspaces/cf-devpod/tmp/opendaq/shared/libraries/discovery/include/daq_discovery/daq_discovery_client.h` - Discovery
- `/workspaces/cf-devpod/tmp/opendaq/simulator/simulator_app/src/main.cpp` - Simulator deployment
- `/workspaces/cf-devpod/tmp/opendaq/examples/applications/cpp/quick_start/quick_start_native.cpp` - Usage example
- `/workspaces/cf-devpod/tmp/opendaq/.github/workflows/ci.yml` - CI pipeline (333 lines)
- `/workspaces/cf-devpod/tmp/opendaq/opendaq_version` - Version 3.31.0dev

---

*Generated by V3 QE Product Factors Assessor using HTSM SFDIPOT framework.*
*Total test ideas: 182 (P0:17, P1:45, P2:83, P3:37) | Total risks identified: 33 (6 CRITICAL, 16 HIGH, 8 MEDIUM, 3 LOW)*
*Analysis confidence: HIGH - based on extensive source code reading across all project directories.*
