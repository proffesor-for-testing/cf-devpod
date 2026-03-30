# openDAQ C++ SDK -- Code Complexity and Quality Analysis Report

**Project**: openDAQ (open-source data acquisition SDK)
**Date**: 2026-03-30
**Analyzer**: QE Code Complexity Analyzer v3
**Scope**: core/, modules/, shared/, simulator/ directories

---

## Executive Summary

The openDAQ SDK comprises **1,284 source files** across **222,261 lines** of C++ code with **4,620 analyzed functions**. The codebase demonstrates a generally well-structured architecture with clear module boundaries, but harbors concentrated complexity hotspots that merit targeted attention.

### Key Metrics at a Glance

| Metric | Value | Assessment |
|--------|-------|------------|
| Total source files | 1,284 | -- |
| Total lines of code | 222,261 | -- |
| Total functions analyzed | 4,620 | -- |
| Mean cyclomatic complexity | 2.1 | GOOD |
| Functions with CC > 15 (HIGH) | 42 (0.9%) | ACCEPTABLE |
| Functions with CC > 25 (CRITICAL) | 11 (0.2%) | NEEDS ATTENTION |
| Functions > 100 lines | 18 | NEEDS ATTENTION |
| Deep nesting >= 4 levels | 44 (1.0%) | MODERATE RISK |
| Files with raw new/delete | 121 | CONCERN |
| Comment density | 15.2% | LOW |

### Risk Heat Map

```
                       LOW RISK              HIGH RISK
core/opendaq/context   [====                        ] MI=100
core/opendaq/device    [====                        ] MI=100
core/opendaq/scheduler [====                        ] MI= 99
core/corecontainers    [====                        ] MI= 98
core/coretypes         [===                         ] MI= 90
core/opendaq/streaming [==                          ] MI= 77
core/opendaq/reader    [==        ***               ] MI= 69
core/opendaq/signal    [==        ***               ] MI= 68
core/opendaq/modulemgr [=         ***               ] MI= 66
shared/discovery_server[=         ****              ] MI= 66
core/coreobjects       [=         ****              ] MI= 65
shared/discovery       [=         *****             ] MI= 62
```

**Overall Assessment**: 93.4% of functions have low complexity (CC 1-5), indicating disciplined development. However, the remaining 6.6% concentrate disproportionate risk, with 11 critically complex functions and 18 functions exceeding 100 lines. The mDNS discovery layer and property validation subsystem are the primary risk areas.

---

## 1. Cyclomatic Complexity Analysis

### 1.1 Distribution

| CC Range | Functions | Percentage | Risk Level |
|----------|-----------|------------|------------|
| 1-5 (Low) | 4,314 | 93.4% | LOW |
| 6-10 (Medium) | 218 | 4.7% | MEDIUM |
| 11-15 (Elevated) | 29 | 0.6% | ELEVATED |
| 16-20 (High) | 42 | 0.9% | HIGH |
| 21-25 (Very High) | 6 | 0.1% | VERY HIGH |
| >25 (Critical) | 11 | 0.2% | CRITICAL |

### 1.2 Top 30 Most Complex Functions

| Rank | CC | Cog | Lines | Nest | Risk | Function | File:Line |
|------|-----|-----|-------|------|------|----------|-----------|
| 1 | **80** | 74 | 161 | 3 | CRITICAL | `validate` | `core/coreobjects/include/coreobjects/property_impl.h:1029` |
| 2 | **53** | 55 | 259 | 7 | CRITICAL | `MDNSDiscoveryServer::openServerSockets` | `shared/libraries/discovery_server/src/mdnsdiscovery_server.cpp:551` |
| 3 | **41** | 40 | 56 | 0 | CRITICAL | `createScalingCalcTyped` | `core/opendaq/signal/include/opendaq/scaling_calc.h:117` |
| 4 | **40** | 42 | 142 | 6 | CRITICAL | `MDNSDiscoveryClient::openClientSockets` | `shared/libraries/discovery/include/daq_discovery/mdnsdiscovery_client.h:488` |
| 5 | **38** | 39 | 87 | 3 | CRITICAL | `DataDescriptorImpl::validate` | `core/opendaq/signal/src/data_descriptor_impl.cpp:216` |
| 6 | **34** | 15 | 98 | 3 | CRITICAL | `EvalValueLexer::scanToken` | `core/coreobjects/src/eval_value_lexer.cpp:39` |
| 7 | **32** | 31 | 148 | 4 | CRITICAL | `StreamingSourceManager::enableStreamingForAddedComponent` | `core/opendaq/streaming/include/opendaq/streaming_source_manager.h:186` |
| 8 | **31** | 22 | 137 | 2 | CRITICAL | `ServerSessionHandler::readHeader` | `shared/libraries/native_streaming_protocol/src/server_session_handler.cpp:164` |
| 9 | **30** | 13 | 48 | 1 | CRITICAL | `CoreEventArgsImpl::validateParameters` | `core/coreobjects/include/coreobjects/core_event_args_impl.h:202` |
| 10 | **27** | 11 | 120 | 3 | CRITICAL | `EvalValueParser::prefix` | `core/coreobjects/src/eval_value_parser.cpp:129` |
| 11 | **27** | 19 | 124 | 2 | CRITICAL | `ClientSessionHandler::readHeader` | `shared/libraries/native_streaming_protocol/src/client_session_handler.cpp:63` |
| 12 | 25 | 25 | 106 | 5 | HIGH | `StreamReaderImpl::readPackets` | `core/opendaq/reader/src/stream_reader_impl.cpp:502` |
| 13 | 24 | 5 | 52 | 2 | HIGH | `ConfigProtocolServer::packCoreEvent` | `shared/libraries/config_protocol/src/config_protocol_server.cpp:570` |
| 14 | 23 | 22 | 110 | 4 | HIGH | `BlockReaderImpl::readPackets` | `core/opendaq/reader/src/block_reader_impl.cpp:296` |
| 15 | 23 | 24 | 125 | 6 | HIGH | `ModuleManagerImpl::tryLoadAndAddModule` | `core/opendaq/modulemanager/src/module_manager_impl.cpp:297` |
| 16 | 21 | 1 | 49 | 1 | HIGH | `getCoreEventName` | `core/coreobjects/include/coreobjects/core_event_args_impl.h:29` |
| 17 | 21 | 21 | 107 | 3 | HIGH | `ModuleManagerImpl::loadModules` | `core/opendaq/modulemanager/src/module_manager_impl.cpp:155` |
| 18 | 20 | 1 | 42 | 1 | HIGH | `TimeReaderBase::readData` | `core/opendaq/reader/include/opendaq/time_reader.h:258` |
| 19 | 20 | 1 | 46 | 2 | HIGH | `isSampleTypeConvertibleTo` | `core/opendaq/reader/src/typed_reader.cpp:98` |
| 20 | 20 | 1 | 41 | 1 | HIGH | `createReaderForType` | `core/opendaq/reader/src/typed_reader.cpp:784` |
| 21 | 20 | 1 | 44 | 1 | HIGH | `format_as` | `core/opendaq/reader/src/typed_reader.cpp:827` |
| 22 | 20 | 18 | 79 | 4 | HIGH | `SignalReader::readUntilNextDataPacket` | `core/opendaq/reader/src/signal_reader.cpp:276` |
| 23 | 20 | 1 | 38 | 1 | HIGH | `createDataRuleCalcTyped` | `core/opendaq/signal/include/opendaq/data_rule_calc.h:445` |
| 24 | 20 | 1 | 43 | 1 | HIGH | `isScaledSampleType` | `core/opendaq/signal/include/opendaq/sample_type_traits.h:317` |
| 25 | 20 | 1 | 40 | 1 | HIGH | `getSampleSize` | `core/opendaq/signal/include/opendaq/sample_type_traits.h:362` |
| 26 | 20 | 1 | 37 | 1 | HIGH | `getDefaultScaledType` | `core/opendaq/signal/include/opendaq/sample_type_traits.h:404` |
| 27 | 20 | 1 | 44 | 1 | HIGH | `convertSampleTypeToString` | `core/opendaq/signal/include/opendaq/sample_type_traits.h:458` |
| 28 | 20 | 21 | 110 | 3 | HIGH | `StreamingSourceManager::attachStreamingsToDevice` | `core/opendaq/streaming/include/opendaq/streaming_source_manager.h:469` |
| 29 | 19 | 18 | 80 | 4 | HIGH | `SignalReader::handleDescriptorChanged` | `core/opendaq/reader/src/signal_reader.cpp:123` |
| 30 | 19 | 20 | 86 | 5 | HIGH | `MultiReaderImpl::checkReferenceDomainInfo` | `core/opendaq/reader/src/multi_reader_impl.cpp:281` |

### 1.3 Detailed Analysis of CRITICAL Functions

#### #1: `PropertyImpl::validate()` -- CC=80, Cognitive=74 (property_impl.h:1029)

This is the most complex function in the entire codebase. It validates property configuration across 161 lines with deeply chained conditional logic covering value types, reference properties, selection values, container types, struct types, and enumerations.

**Root cause**: The function attempts to validate all property constraints in a single monolithic method. Each property type (function/procedure, reference, object, list, dict, struct, enumeration) has its own validation rules, all interleaved in one sequence.

**Evidence** (line 1029-1189): A chain of `if/else if` blocks checking `valueType` against `ctFunc`, `ctProc`, `ctObject`, `ctList`, `ctDict`, `ctStruct`, `ctEnumeration` with nested validation logic for each. Boolean accumulator pattern (`valid = valid && !X.assigned()`) is repeated across types.

**Recommendation**: Decompose into type-specific validators using a strategy pattern or dispatch table. Estimated reduction: CC 80 to CC ~8-12 per extracted method.

#### #2: `MDNSDiscoveryServer::openServerSockets()` -- CC=53, Cognitive=55 (mdnsdiscovery_server.cpp:551)

A 259-line function handling platform-specific network socket creation. Contains `#ifdef _WIN32` / `#else` blocks with deeply nested iteration over network adapters, socket options, and multicast group management.

**Root cause**: Platform-specific code for Windows (GetAdaptersAddresses + malloc/free) and POSIX (getifaddrs) is implemented inline in a single function. Each platform branch handles both IPv4 and IPv6 with identical socket configuration logic.

**Evidence** (line 551-809): Windows branch uses `malloc`/`free` for `IP_ADAPTER_ADDRESSES` (C-style memory management in C++), POSIX branch uses `getifaddrs`. Both contain nested loops: outer adapter loop, inner unicast address loop, IPv4/IPv6 branching with socket setup and multicast configuration.

**Recommendation**: Extract platform-specific implementations into separate functions. Abstract IPv4/IPv6 socket setup into a shared helper. Replace malloc/free with RAII wrapper.

#### #3: `createScalingCalcTyped()` -- CC=41, Cognitive=40 (scaling_calc.h:117)

Contains 40 consecutive `if` statements mapping every combination of input SampleType and output ScaledSampleType to a template instantiation. Each branch allocates via `new` and returns a raw pointer.

**Evidence** (line 117-172): 20 pairs of `if (inputType == SampleType::X && outputType == ScaledSampleType::Y) return new ScalingCalcTyped<...>(scaling);`

**Recommendation**: Replace with a lookup table or template dispatch mechanism. This is a classic code generation candidate that could be reduced to a compile-time dispatch.

#### #4: `MDNSDiscoveryClient::openClientSockets()` -- CC=40, Cognitive=42 (mdnsdiscovery_client.h:488)

Near-identical structure to #2 but in a header file. This 142-line function contains the same malloc/free pattern, the same platform-conditional code, and the same socket setup duplication.

**Evidence**: The code between mdnsdiscovery_client.h:488-630 and mdnsdiscovery_server.cpp:551-809 shares approximately 70% structural similarity, with identical adapter enumeration, address filtering, and multicast socket configuration logic.

---

## 2. Cognitive Complexity Analysis

### 2.1 Top 20 Cognitive Complexity Hotspots

| Rank | Cognitive | CC | Lines | Nesting | Function | File:Line |
|------|-----------|-----|-------|---------|----------|-----------|
| 1 | **74** | 80 | 161 | 3 | `PropertyImpl::validate` | `core/coreobjects/include/coreobjects/property_impl.h:1029` |
| 2 | **55** | 53 | 259 | 7 | `MDNSDiscoveryServer::openServerSockets` | `shared/libraries/discovery_server/src/mdnsdiscovery_server.cpp:551` |
| 3 | **42** | 40 | 142 | 6 | `MDNSDiscoveryClient::openClientSockets` | `shared/libraries/discovery/include/daq_discovery/mdnsdiscovery_client.h:488` |
| 4 | **40** | 41 | 56 | 0 | `createScalingCalcTyped` | `core/opendaq/signal/include/opendaq/scaling_calc.h:117` |
| 5 | **39** | 38 | 87 | 3 | `DataDescriptorImpl::validate` | `core/opendaq/signal/src/data_descriptor_impl.cpp:216` |
| 6 | **31** | 32 | 148 | 4 | `StreamingSourceManager::enableStreamingForAddedComponent` | `core/opendaq/streaming/include/opendaq/streaming_source_manager.h:186` |
| 7 | **25** | 25 | 106 | 5 | `StreamReaderImpl::readPackets` | `core/opendaq/reader/src/stream_reader_impl.cpp:502` |
| 8 | **24** | 23 | 125 | 6 | `ModuleManagerImpl::tryLoadAndAddModule` | `core/opendaq/modulemanager/src/module_manager_impl.cpp:297` |
| 9 | **22** | 23 | 110 | 4 | `BlockReaderImpl::readPackets` | `core/opendaq/reader/src/block_reader_impl.cpp:296` |
| 10 | **22** | 31 | 137 | 2 | `ServerSessionHandler::readHeader` | `shared/libraries/native_streaming_protocol/src/server_session_handler.cpp:164` |
| 11 | **21** | 20 | 110 | 3 | `StreamingSourceManager::attachStreamingsToDevice` | `core/opendaq/streaming/include/opendaq/streaming_source_manager.h:469` |
| 12 | **21** | 21 | 107 | 3 | `ModuleManagerImpl::loadModules` | `core/opendaq/modulemanager/src/module_manager_impl.cpp:155` |
| 13 | **20** | 19 | 86 | 5 | `MultiReaderImpl::checkReferenceDomainInfo` | `core/opendaq/reader/src/multi_reader_impl.cpp:281` |
| 14 | **19** | 27 | 124 | 2 | `ClientSessionHandler::readHeader` | `shared/libraries/native_streaming_protocol/src/client_session_handler.cpp:63` |
| 15 | **18** | 19 | 80 | 4 | `SignalReader::handleDescriptorChanged` | `core/opendaq/reader/src/signal_reader.cpp:123` |
| 16 | **18** | 20 | 79 | 4 | `SignalReader::readUntilNextDataPacket` | `core/opendaq/reader/src/signal_reader.cpp:276` |
| 17 | **18** | 15 | 118 | 3 | `MdnsDiscoveryServerImpl::registerIpModificationService` | `core/opendaq/modulemanager/src/mdns_discovery_server_impl.cpp:123` |
| 18 | **18** | 19 | 71 | 3 | `MDNSDiscoveryClient::createDevices` | `shared/libraries/discovery/include/daq_discovery/mdnsdiscovery_client.h:640` |
| 19 | **17** | 18 | 59 | 3 | `ModuleManagerImpl::completeServerCapabilities` | `core/opendaq/modulemanager/src/module_manager_impl.cpp:1557` |
| 20 | **16** | 17 | 94 | 5 | `ModuleManagerImpl::createFunctionBlock` | `core/opendaq/modulemanager/src/module_manager_impl.cpp:1041` |

### 2.2 Deep Nesting Analysis (>= 4 levels)

44 functions have nesting depth of 4 or more. The most deeply nested:

| Nesting | Function | File |
|---------|----------|------|
| **7** | `MDNSDiscoveryServer::openServerSockets` | `shared/libraries/discovery_server/src/mdnsdiscovery_server.cpp:551` |
| **6** | `TailReaderImpl::packetReceived` | `core/opendaq/reader/src/tail_reader_impl.cpp:262` |
| **6** | `ModuleManagerImpl::tryLoadAndAddModule` | `core/opendaq/modulemanager/src/module_manager_impl.cpp:297` |
| **6** | `MDNSDiscoveryClient::openClientSockets` | `shared/libraries/discovery/include/daq_discovery/mdnsdiscovery_client.h:488` |
| **6** | `ConfigProtocolStreamingProducer::readerThreadFunc` | `shared/libraries/config_protocol/src/config_protocol_streaming_producer.cpp:163` |
| **5** | `StreamReaderImpl::readPackets` | `core/opendaq/reader/src/stream_reader_impl.cpp:502` |
| **5** | `MultiReaderImpl::checkReferenceDomainInfo` | `core/opendaq/reader/src/multi_reader_impl.cpp:281` |
| **5** | `ConnectionImpl::getSamplesUntilNextEventPacket` | `core/opendaq/signal/src/connection_impl.cpp:316` |
| **5** | `ConnectionImpl::getSamplesUntilNextDescriptor` | `core/opendaq/signal/src/connection_impl.cpp:356` |
| **5** | `ConnectionImpl::getSamplesUntilNextGapPacket` | `core/opendaq/signal/src/connection_impl.cpp:401` |
| **5** | `ModuleManagerImpl::createFunctionBlock` | `core/opendaq/modulemanager/src/module_manager_impl.cpp:1041` |
| **5** | `NativeStreamingServerImpl::startReadThread` | `modules/native_streaming_server_module/src/native_streaming_server_impl.cpp:597` |

---

## 3. Code Smells

### 3.1 Long Methods (> 100 lines)

18 functions exceed 100 lines. The worst offenders:

| Lines | CC | Function | File:Line |
|-------|-----|----------|-----------|
| **259** | 53 | `MDNSDiscoveryServer::openServerSockets` | `shared/libraries/discovery_server/src/mdnsdiscovery_server.cpp:551` |
| **161** | 80 | `PropertyImpl::validate` | `core/coreobjects/include/coreobjects/property_impl.h:1029` |
| **148** | 32 | `StreamingSourceManager::enableStreamingForAddedComponent` | `core/opendaq/streaming/include/opendaq/streaming_source_manager.h:186` |
| **147** | 10 | `MDNSDiscoveryClient::sendDiscoveryQuery` | `shared/libraries/discovery/include/daq_discovery/mdnsdiscovery_client.h:1146` |
| **142** | 40 | `MDNSDiscoveryClient::openClientSockets` | `shared/libraries/discovery/include/daq_discovery/mdnsdiscovery_client.h:488` |
| **138** | 12 | `ModuleManagerImpl::getAvailableDevices` | `core/opendaq/modulemanager/src/module_manager_impl.cpp:569` |
| **137** | 31 | `ServerSessionHandler::readHeader` | `shared/libraries/native_streaming_protocol/src/server_session_handler.cpp:164` |
| **125** | 23 | `ModuleManagerImpl::tryLoadAndAddModule` | `core/opendaq/modulemanager/src/module_manager_impl.cpp:297` |
| **124** | 27 | `ClientSessionHandler::readHeader` | `shared/libraries/native_streaming_protocol/src/client_session_handler.cpp:63` |
| **121** | 14 | `MDNSDiscoveryServer::serviceLoop` | `shared/libraries/discovery_server/src/mdnsdiscovery_server.cpp:428` |
| **120** | 27 | `EvalValueParser::prefix` | `core/coreobjects/src/eval_value_parser.cpp:129` |
| **118** | 15 | `MdnsDiscoveryServerImpl::registerIpModificationService` | `core/opendaq/modulemanager/src/mdns_discovery_server_impl.cpp:123` |

### 3.2 God Classes

The following classes exhibit god class characteristics through excessive method counts and file sizes. These were identified by analyzing header files with full template implementation:

| Class | File | Lines | Methods | Assessment |
|-------|------|-------|---------|------------|
| **PropertyObjectImpl** | `core/coreobjects/include/coreobjects/property_object_impl.h` | **3,698** | **~50+ virtual** | CRITICAL -- handles property CRUD, serialization, events, permissions, cloning, locking |
| **GenericDevice (DeviceImpl)** | `core/opendaq/device/include/opendaq/device_impl.h` | **2,457** | **~45+ virtual** | HIGH -- manages devices, signals, channels, servers, locking, operation modes, logging |
| **ObjectPtr** | `core/coretypes/include/coretypes/objectptr.h` | **2,503** | **~535 methods** | HIGH -- universal smart pointer with exhaustive interface forwarding (template bloat) |
| **ComponentImpl** | `core/opendaq/component/include/opendaq/component_impl.h` | **1,457** | **~35+ virtual** | MODERATE -- base component with attributes, events, status, search |
| **SignalImpl** | `core/opendaq/signal/include/opendaq/signal_impl.h` | **1,351** | **~25+ virtual** | MODERATE -- signal management with connections and domain signals |
| **StreamingImpl** | `core/opendaq/streaming/include/opendaq/streaming_impl.h` | **1,219** | **~25+ virtual** | MODERATE -- streaming lifecycle and signal management |
| **DeviceInfoImpl** | `core/opendaq/device/include/opendaq/device_info_impl.h` | **1,225** | **~30+ virtual** | MODERATE -- device metadata with many property accessors |
| **MDNSDiscoveryClient** | `shared/libraries/discovery/include/daq_discovery/mdnsdiscovery_client.h` | **1,294** | **~15** | HIGH -- entire class implemented inline in header with platform-specific code |

**PropertyObjectImpl** at 3,698 lines is the clearest god class. It implements at least 7 distinct responsibilities: property CRUD, property value events, serialization/deserialization, permission management, update batching, core event triggering, and cloning.

### 3.3 Long Parameter Lists (> 5 parameters)

13 functions have more than 5 parameters. Most are constructor delegation patterns:

| Params | Function | File:Line |
|--------|----------|-----------|
| 7 | `createAndConnectClient` | `shared/libraries/config_protocol/tests/test_c2d_streaming.cpp:338` |
| 7 | `Super` (ConfigClientIoFolder) | `shared/libraries/config_protocol/include/config_protocol/config_client_io_folder_impl.h:55` |
| 7 | `Super` (ConfigClientFunctionBlock) | `shared/libraries/config_protocol/include/config_protocol/config_client_function_block_impl.h:85` |
| 7 | `Super` (ConfigClientServer) | `shared/libraries/config_protocol/include/config_protocol/config_client_server_impl.h:54` |
| 7 | `Super` (ConfigClientChannel) | `shared/libraries/config_protocol/include/config_protocol/config_client_channel_impl.h:48` |
| 6 | `DevelopmentVersionInfo` | `core/coretypes/include/coretypes/version_info_factory.h:63` |
| 6 | `makeErrorInfo` | `core/coretypes/include/coretypes/ctutils.h:320` |

The `Super` calls in config_protocol pass 7 parameters through constructor chains. The `config_client_*_impl.h` files consistently use 6-7 parameter constructors to delegate to their base class, indicating a design where configuration context is threaded through constructors rather than injected.

### 3.4 Duplicated Code Patterns

#### Pattern 1: SampleType Switch Cascades (296 case statements across 8 files)

The `SampleType` enumeration has ~20 values that are dispatched via long switch/if chains in multiple files:

- `core/opendaq/signal/include/opendaq/scaling_calc.h` -- 40 if-branches (CC=41)
- `core/opendaq/signal/include/opendaq/sample_type_traits.h` -- 5 separate switch functions (CC=20 each)
- `core/opendaq/signal/include/opendaq/data_rule_calc.h` -- switch on SampleType (CC=20)
- `core/opendaq/signal/include/opendaq/reference_domain_offset_adder.h` -- switch on SampleType
- `core/opendaq/reader/src/typed_reader.cpp` -- 4 separate switch functions (CC=20 each)
- `core/opendaq/signal/include/opendaq/data_packet_impl.h` -- switch on SampleType
- `core/opendaq/signal/src/connection_impl.cpp` -- 3 switch functions

**Impact**: ~296 case labels implementing essentially the same type-dispatch pattern. Any addition of a new SampleType requires changes in 8+ files.

**Recommendation**: Introduce a SampleType dispatch template or type-trait mechanism. A `SampleTypeVisitor<Func>` would eliminate most of these switches.

#### Pattern 2: mDNS Socket Setup Duplication (Client vs Server)

`mdnsdiscovery_client.h` (1,294 lines) and `mdnsdiscovery_server.cpp` (1,087 lines) contain nearly identical platform-specific socket creation logic:
- Same `malloc`/`free` pattern for Windows adapter addresses
- Same `getifaddrs` pattern for POSIX
- Same IPv4/IPv6 multicast group join logic
- Same adapter filtering (tunnel type, operational status, loopback)

11 matching lines referencing adapter/ifaddrs patterns in each file. Approximately 200+ lines of structurally duplicated code.

#### Pattern 3: readHeader Protocol Dispatch (Client vs Server)

`server_session_handler.cpp:readHeader` (137 lines, CC=31) and `client_session_handler.cpp:readHeader` (124 lines, CC=27) contain the same structural pattern: a long `if/else if` chain dispatching on `PayloadType`, each branch creating a `ReadTask` with a lambda capturing `weak_from_this()`. The patterns are structurally identical but dispatch to different handler methods.

### 3.5 Magic Numbers

The codebase uses some hardcoded numeric literals without named constants:

- `shared/libraries/discovery_server/src/mdnsdiscovery_server.cpp:554` -- `addressSize = 8000` (initial buffer for Windows adapter addresses)
- `shared/libraries/discovery_server/src/mdnsdiscovery_server.cpp:556` -- `numRetries = 4` (retry count)
- `shared/libraries/discovery/include/daq_discovery/mdnsdiscovery_client.h:491-492` -- Same `8000` and `4` pattern
- Multicast addresses `"224.0.0.251"` and `"ff02::fb"` used as string literals rather than named constants

---

## 4. Maintainability Index

Scored on a 0-100 scale considering cyclomatic complexity, cognitive complexity, nesting depth, long methods, comment density, and critical function count.

### 4.1 Top 10 Most Maintainable Modules

| Rank | MI | Module | Files | Lines | Rationale |
|------|-----|--------|-------|-------|-----------|
| 1 | **100** | core/opendaq/context | 3 | 184 | Minimal code, single-purpose |
| 2 | **100** | core/opendaq/component | 57 | 7,722 | Low avg CC (1.9), no critical functions, good comments |
| 3 | **100** | core/opendaq/device | 70 | 12,422 | Low avg CC (1.6), max CC=8, well-structured |
| 4 | **100** | core/opendaq/functionblock | 16 | 1,732 | Small, focused, low complexity |
| 5 | **100** | core/opendaq/synchronization | 7 | 716 | Tiny, simple, well-documented |
| 6 | **99** | core/opendaq/scheduler | 33 | 2,822 | Low CC, clean structure |
| 7 | **99** | core/opendaq/server | 9 | 694 | Small, focused interfaces |
| 8 | **98** | shared/libraries/utils | 15 | 1,301 | Utility functions, low coupling |
| 9 | **98** | core/corecontainers | 15 | 3,105 | Clean container implementations |
| 10 | **98** | core/opendaq/logger | 34 | 3,478 | Straightforward logging wrappers |

### 4.2 Top 10 Least Maintainable Modules

| Rank | MI | Module | Files | Lines | Key Issues |
|------|-----|--------|-------|-------|------------|
| 1 | **62** | shared/libraries/discovery | 4 | 1,540 | Avg CC=6.6, max CC=40, 1 critical, malloc/free |
| 2 | **65** | core/coreobjects | 177 | 30,233 | CC=80 validator, 4 critical functions, god classes |
| 3 | **66** | core/opendaq/modulemanager | 50 | 6,862 | 4 high-CC functions, 2,102-line implementation |
| 4 | **66** | shared/libraries/discovery_server | 3 | 1,270 | CC=53, deep nesting, malloc/free |
| 5 | **68** | core/opendaq/signal | 153 | 24,294 | CC=41 scaling, 2 critical, SampleType switches |
| 6 | **69** | core/opendaq/reader | 61 | 25,057 | 9 high-CC functions, deep nesting |
| 7 | **71** | shared/libraries/native_streaming_protocol | 21 | 6,569 | 2 critical (readHeader), low comments |
| 8 | **77** | core/opendaq/streaming | 30 | 5,784 | 1 critical, 1 high, complex state management |
| 9 | **84** | shared/libraries/config_protocol | 62 | 18,895 | 3 high-CC functions, 1,073-line client impl |
| 10 | **84** | simulator | 1 | 62 | N/A (too small to be meaningful) |

### 4.3 Maintainability Concerns by Category

**Coupling**: The `module_manager_impl.cpp` (2,102 lines) has 36 `#include` directives, indicating high coupling. The file coordinates module loading, device discovery, function block creation, server management, and capability resolution -- too many responsibilities for a single implementation.

**Cohesion**: `PropertyObjectImpl` (3,698 lines) mixes property management, serialization, event handling, permission checking, and cloning in one template class. Low cohesion.

**Documentation**: Overall comment density is 15.2% (33,528 comment lines / 220,916 total lines). Headers tend to have better documentation (Doxygen-style comments on interfaces), but implementation files average lower. The `shared/libraries/` modules have notably lower comment ratios (10-13%).

---

## 5. Code Organization

### 5.1 Namespace Usage

The project uses a consistent macro-based namespace system:

| Namespace Pattern | Count | Assessment |
|-------------------|-------|------------|
| `BEGIN_NAMESPACE_OPENDAQ` / `END_NAMESPACE_OPENDAQ` | 821 pairs | PRIMARY -- consistent |
| `namespace daq::config_protocol` | 43 | Direct style for config protocol |
| `BEGIN_NAMESPACE_DEWESOFT_RT_CORE` | 17 pairs | LEGACY -- old company name still present |
| `BEGIN_NAMESPACE_OPENDAQ_NATIVE_STREAMING_PROTOCOL` | 14 pairs | Consistent subnamespace |
| `BEGIN_NAMESPACE_OPENDAQ_NATIVE_STREAMING_CLIENT_MODULE` | 10 pairs | Consistent |
| `BEGIN_NAMESPACE_UTILS` / `END_NAMESPACE_UTILS` | 9 pairs | Utility namespace |
| `namespace detail` / `namespace Detail` | 18 + 3 | INCONSISTENT -- mixed case |

**Findings**:
- The legacy `DEWESOFT_RT_CORE` namespace (17 occurrences) indicates incomplete migration from a previous company/project name.
- `detail` vs `Detail` namespace casing is inconsistent (lowercase in some files, PascalCase in others).
- The config_protocol module uses direct `namespace daq::config_protocol` while others use macros -- a minor inconsistency.

### 5.2 Header/Source Organization

| Pattern | Count | Assessment |
|---------|-------|------------|
| `#pragma once` headers | 819 | GOOD -- consistent modern guard |
| `#ifndef` traditional guards | 2 | Negligible outlier |
| Header-only implementations > 500 lines | 9 files | CONCERN |

**Large Header-Only Implementations** (source logic in .h files):

| File | Lines | Concern |
|------|-------|---------|
| `property_object_impl.h` | 3,698 | Full template class implementation |
| `device_impl.h` | 2,457 | Full template class implementation |
| `objectptr.h` | 2,503 | Smart pointer with 535+ methods |
| `property_impl.h` | 1,814 | Full template implementation |
| `property.h` | 710 | Interface definitions with inline methods |
| `reader_impl.h` | 571 | Template reader base |
| `dictptr.h` | 555 | Dictionary pointer template |
| `listptr.h` | 506 | List pointer template |
| `reader_factory.h` | 531 | Factory function template |

This is partially inherent to template-heavy C++ design, but the 3,698-line `property_object_impl.h` combines template necessity with genuine over-concentration of logic. Non-template portions could be moved to .cpp files.

### 5.3 Module Dependencies

The project is organized as a layered architecture:

```
                     [modules/]
                         |
                  [core/opendaq/]
                    /    |    \
           [device] [signal] [reader] [streaming] [modulemanager]
                    \    |    /
                 [core/coreobjects/]
                         |
                  [core/coretypes/]
                         |
                [core/corecontainers/]

     [shared/libraries/]  (parallel utilities)
         config_protocol
         native_streaming_protocol
         discovery / discovery_server
         packet_streaming
```

The layering is generally well-maintained. The `coreobjects` -> `coretypes` -> `corecontainers` dependency chain is clean. The `shared/libraries/` modules serve as utility libraries consumed by both core and modules.

**Potential circular concern**: `PropertyObjectImpl` (in `coreobjects`) is included by `device_impl.h` and `component_impl.h` (in `core/opendaq`), while `core_event_args` in `coreobjects` references opendaq-level concepts. This coupling between coreobjects and opendaq layers could benefit from interface segregation.

---

## 6. C++ Specific Issues

### 6.1 Memory Management

| Pattern | Count | Assessment |
|---------|-------|------------|
| `shared_ptr` / `make_shared` | 215 | MODERATE usage |
| `unique_ptr` / `make_unique` | 264 | MODERATE usage |
| Raw `new` (functional, not in comments) | ~118 | CONCERN |
| Raw `delete` (functional) | ~70 | CONCERN |
| `malloc` / `free` / `calloc` / `realloc` | 118 | CONCERN for C++ code |

**Critical Finding**: 121 files contain raw `new`/`delete` usage. Some is intentional (COM-style reference-counted objects), but several cases represent genuine RAII violations:

**packet_streaming_server.cpp:148-165**: Allocates `GenericPacketHeader` with `new`, passes ownership via raw pointer into a lambda deleter:
```cpp
const auto packetHeader = new GenericPacketHeader();
// ... setup ...
const auto packetBuffer = std::make_shared<PacketBuffer>(
    packetHeader,
    ...,
    [packetHeader, serializedPacket]() mutable {
        delete packetHeader;   // Manual delete in lambda
    });
```
This should use `std::unique_ptr<GenericPacketHeader>` passed to the buffer.

**scaling_calc.h:117-172**: Factory function returns raw `ScalingCalc*` via `new`. Caller must manually manage lifetime. Should return `std::unique_ptr<ScalingCalc>`.

**mdnsdiscovery_server.cpp:559/575/685**: Uses `malloc`/`free` for `IP_ADAPTER_ADDRESSES` buffer -- C-style memory management. Should use a RAII wrapper or `std::vector<char>`.

### 6.2 Type Casting

| Cast Type | Count | Assessment |
|-----------|-------|------------|
| `static_cast` | 920 | Normal C++ usage |
| `reinterpret_cast` | 205 | Elevated -- many in network/protocol code |
| C-style casts | Present in tests | Minor concern |

The 205 `reinterpret_cast` usages are concentrated in the network/protocol layer (`mdnsdiscovery_client.h`, `mdnsdiscovery_server.cpp`) for `sockaddr` casting, which is standard practice for socket programming. Some in `packet_streaming` for buffer manipulation.

### 6.3 Exception Safety

| Pattern | Count | Assessment |
|---------|-------|------------|
| `try` blocks | ~213* | Significant usage |
| `catch(...)` (catch-all) | 84 | CONCERN -- swallows exception information |
| `noexcept` specifications | 115 | LOW adoption |
| Error-code returns (OPENDAQ_RETURN_IF_FAILED) | 2,232 | PRIMARY error model |

*The try block count is low relative to catch blocks because the project uses a `daqTry` wrapper macro that generates try/catch blocks.

**Key observations**:
- The project uses a **hybrid error model**: COM-style `ErrCode` returns at API boundaries with C++ exceptions internally, wrapped by `daqTry`.
- **84 catch-all handlers** (`catch(...)`) represent information loss. When these trigger, the original exception type and message are discarded.
- **115 `noexcept`** annotations out of 4,620 functions (2.5%) is low. Move constructors, swap functions, and destructors should consistently be marked `noexcept`.

### 6.4 const Correctness

| Pattern | Count |
|---------|-------|
| `const` reference parameters | 4,741 |
| `const` member functions | 249 |

The project shows good discipline with const reference parameters (4,741 occurrences). However, 249 const member functions across 4,620 total functions suggests that const qualification on methods could be more broadly applied, particularly in the reader and signal modules.

### 6.5 Move Semantics

| Pattern | Count |
|---------|-------|
| `std::move` | 359 |
| Rvalue references (`&&`) | 690 |

Move semantics are used but could be more consistently applied. The smart pointer types (`ObjectPtr`, `StringPtr`) use move semantics in their implementations, contributing to the rvalue reference count.

### 6.6 Template Complexity

| Metric | Value |
|--------|-------|
| Template declarations | 2,367 |
| Largest template header | `objectptr.h` (2,503 lines, ~535 methods) |
| Macro-heavy files | `macro_utils.h` (162 defines), `factory.h` (122 defines) |

The `ObjectPtr<T>` template (2,503 lines) is a universal smart pointer that wraps openDAQ interfaces. It provides exhaustive forwarding methods for every possible interface the wrapped object might support. At 535+ methods, this is the single largest source of template complexity. While the design intent (type-safe interface access) is sound, the implementation produces significant compile-time overhead.

`macro_utils.h` (162 `#define`) and `factory.h` (122 `#define`) are macro-intensive utility headers. The factory macros generate boilerplate for COM-style object creation. This is acceptable for the SDK's COM interop design but reduces readability and complicates debugging.

---

## 7. Hotspot Risk Matrix

Combining complexity, nesting, method length, and module criticality into a unified risk score:

| Risk | Function | File | CC | Cog | Lines | Nest | Impact |
|------|----------|------|----|-----|-------|------|--------|
| **0.98** | `PropertyImpl::validate` | `core/coreobjects/.../property_impl.h:1029` | 80 | 74 | 161 | 3 | Core property validation; all property creation paths |
| **0.95** | `MDNSDiscoveryServer::openServerSockets` | `shared/.../mdnsdiscovery_server.cpp:551` | 53 | 55 | 259 | 7 | Server discovery initialization |
| **0.92** | `MDNSDiscoveryClient::openClientSockets` | `shared/.../mdnsdiscovery_client.h:488` | 40 | 42 | 142 | 6 | Client discovery initialization |
| **0.90** | `createScalingCalcTyped` | `core/.../scaling_calc.h:117` | 41 | 40 | 56 | 0 | Signal scaling pipeline |
| **0.88** | `DataDescriptorImpl::validate` | `core/.../data_descriptor_impl.cpp:216` | 38 | 39 | 87 | 3 | Data format validation |
| **0.85** | `StreamingSourceManager::enableStreamingForAddedComponent` | `core/.../streaming_source_manager.h:186` | 32 | 31 | 148 | 4 | Streaming connection management |
| **0.83** | `ServerSessionHandler::readHeader` | `shared/.../server_session_handler.cpp:164` | 31 | 22 | 137 | 2 | Protocol message dispatch |
| **0.80** | `EvalValueLexer::scanToken` | `core/coreobjects/src/eval_value_lexer.cpp:39` | 34 | 15 | 98 | 3 | Expression evaluation lexer |
| **0.78** | `StreamReaderImpl::readPackets` | `core/.../stream_reader_impl.cpp:502` | 25 | 25 | 106 | 5 | Data reading pipeline |
| **0.75** | `ModuleManagerImpl::tryLoadAndAddModule` | `core/.../module_manager_impl.cpp:297` | 23 | 24 | 125 | 6 | Module loading |

---

## 8. Recommendations

### Priority 1: CRITICAL (Immediate impact, high ROI)

#### R1. Decompose `PropertyImpl::validate()` (CC=80)
**File**: `core/coreobjects/include/coreobjects/property_impl.h:1029`
**Strategy**: Extract type-specific validators.
```
validate() -> validateFunctionProperty()
           -> validateReferenceProperty()
           -> validateObjectProperty()
           -> validateContainerProperty()
           -> validateStructProperty()
           -> validateEnumerationProperty()
           -> validateSelectionProperty()
           -> validateMinMax()
           -> validateCallableInfo()
```
**Estimated reduction**: CC 80 -> CC ~8-10 per method.
**Testability improvement**: Each validator can be unit-tested independently with focused test cases for each property type.

#### R2. Extract Common mDNS Socket Logic
**Files**: `shared/libraries/discovery_server/src/mdnsdiscovery_server.cpp`, `shared/libraries/discovery/include/daq_discovery/mdnsdiscovery_client.h`
**Strategy**: Create a shared `MdnsSocketFactory` class in `shared/libraries/discovery_common/` that encapsulates:
- Platform adapter enumeration (Windows vs POSIX)
- IPv4/IPv6 socket creation with multicast group joining
- RAII wrappers for `malloc`/`free` and `getifaddrs`

**Estimated reduction**: ~200 lines of duplication eliminated, CC reduced from 53/40 to ~15 each.

#### R3. Introduce SampleType Dispatch Mechanism
**Files**: 8 files with 296 `case SampleType::` labels.
**Strategy**: Create a template-based visitor or dispatch table:
```cpp
template<typename Visitor>
auto dispatchSampleType(SampleType type, Visitor&& visitor) {
    switch(type) {
        case SampleType::Float32: return visitor.template operator()<float>();
        // ... one definitive switch
    }
}
```
**Estimated reduction**: Eliminates 7 of 8 switch cascades. New SampleType additions require changes in 1 file instead of 8.

### Priority 2: HIGH (Significant improvement, moderate effort)

#### R4. Refactor readHeader Protocol Dispatch
**Files**: `server_session_handler.cpp`, `client_session_handler.cpp`
**Strategy**: Replace the long `if/else if` chain with a `std::unordered_map<PayloadType, HandlerFunc>` dispatch table initialized at construction. Both client and server can share a base pattern.
**Estimated reduction**: CC 31/27 -> CC ~5 each.

#### R5. Split PropertyObjectImpl into Focused Concerns
**File**: `core/coreobjects/include/coreobjects/property_object_impl.h` (3,698 lines)
**Strategy**: Extract into:
- `PropertyObjectStorage` -- property CRUD operations
- `PropertyObjectSerializer` -- serialization/deserialization
- `PropertyObjectEvents` -- event handling and triggers
- `PropertyObjectPermissions` -- permission management

This is complex due to the template-heavy design but would significantly improve maintainability.

#### R6. Modernize Memory Management in Packet Streaming
**File**: `shared/libraries/packet_streaming/src/packet_streaming_server.cpp`
**Strategy**: Replace `new GenericPacketHeader()` / `delete` with `std::make_unique<GenericPacketHeader>()` and transfer ownership properly. Replace `new Int[n]` with `std::vector<Int>`.

#### R7. Break Down `ModuleManagerImpl`
**File**: `core/opendaq/modulemanager/src/module_manager_impl.cpp` (2,102 lines, 36 includes)
**Strategy**: Extract responsibilities:
- Module loading/authentication -> `ModuleLoader`
- Device discovery/enumeration -> `DeviceDiscovery`
- Function block management -> `FunctionBlockRegistry`
- Server capability management -> `CapabilityResolver`

### Priority 3: MEDIUM (Incremental improvement)

#### R8. Eliminate catch-all Handlers
Replace 84 `catch(...)` blocks with typed exception handling or at minimum `catch(const std::exception& e)` to preserve error information.

#### R9. Increase `noexcept` Coverage
Add `noexcept` to move constructors, move assignment operators, swap functions, and destructors across the codebase. Currently only 115 of 4,620 functions use `noexcept`.

#### R10. Clean Up Legacy Namespaces
Remove or alias the 17 `DEWESOFT_RT_CORE` namespace references. Standardize `detail` vs `Detail` to lowercase.

#### R11. Improve Comment Density in shared/libraries
The `shared/libraries/` modules average 10-13% comment density compared to 27-36% in core headers. Add function-level documentation for public APIs.

#### R12. Reduce Header Implementation Size
Move non-template portions of `property_object_impl.h`, `device_impl.h`, and `component_impl.h` into `.cpp` files where possible. This will reduce compile times and improve encapsulation.

---

## Appendix A: File-Level Metrics for Largest Files

| File | Lines | Functions | Avg CC | Max CC | Comment % |
|------|-------|-----------|--------|--------|-----------|
| `core/coreobjects/include/coreobjects/property_object_impl.h` | 3,698 | -- | -- | -- | ~30% |
| `core/opendaq/reader/tests/test_multi_reader.cpp` | 5,236 | -- | -- | -- | ~15% |
| `core/coretypes/include/coretypes/objectptr.h` | 2,503 | -- | -- | -- | ~40% |
| `core/opendaq/device/include/opendaq/device_impl.h` | 2,457 | -- | -- | -- | ~25% |
| `core/opendaq/modulemanager/src/module_manager_impl.cpp` | 2,102 | 24 | 2.9 | 23 | ~15% |
| `core/opendaq/reader/src/multi_reader_impl.cpp` | 1,798 | -- | -- | -- | ~10% |
| `core/coreobjects/include/coreobjects/property_impl.h` | 1,814 | -- | -- | 80 | ~25% |
| `shared/libraries/discovery/include/daq_discovery/mdnsdiscovery_client.h` | 1,294 | 18 | 6.6 | 40 | ~28% |
| `shared/libraries/config_protocol/src/config_protocol_client.cpp` | 1,073 | 36 | 1.9 | 24 | ~10% |
| `core/coreobjects/src/eval_value_impl.cpp` | 1,017 | 101 | -- | -- | ~5% |

## Appendix B: Technology Stack Observations

| Aspect | Observation |
|--------|-------------|
| Build system | CMake with modern presets |
| C++ standard | C++17 (template features, structured bindings, constexpr if) |
| Smart pointer framework | Custom `ObjectPtr<T>` wrapping COM-style `IBaseObject` |
| Error model | Hybrid: COM-style `ErrCode` at API boundaries, C++ exceptions internally |
| Serialization | Custom JSON serializer with `ISerializable` interface |
| Networking | Raw POSIX/Winsock sockets with mdns library |
| Threading | `std::mutex`, `std::condition_variable`, `std::thread` |
| Testing | Google Test (gtest) |
| Third-party | Boost (algorithm), RapidJSON, TSL ordered containers, fmt, spdlog |

## Appendix C: Complexity Thresholds Used

| Metric | Low | Medium | High | Critical |
|--------|-----|--------|------|----------|
| Cyclomatic Complexity | 1-5 | 6-10 | 11-20 | >20 |
| Cognitive Complexity | 1-8 | 9-15 | 16-25 | >25 |
| Nesting Depth | 1-2 | 3 | 4-5 | >5 |
| Method Lines | 1-20 | 21-50 | 51-100 | >100 |
| Parameters | 1-3 | 4-5 | 6-7 | >7 |
| Maintainability Index | 80-100 | 60-79 | 40-59 | 0-39 |

---

*Report generated by QE Code Complexity Analyzer v3. All metrics computed by static analysis of source code. Line numbers reference the project as of 2026-03-30.*
