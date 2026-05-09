# Integration Demo #4: Claude Code Slash Commands

**Workshop: Quality Engineering in the Agentic Age**
**Phase: ORCHESTRATE**

Claude Code supports custom slash commands that integrate Agentic QE agents directly into your development workflow. This guide shows how to set up and use these commands.

---

## Setup

Claude Code looks for slash commands in two places:

- `.claude/commands/` (project-scoped — checked in with the repo)
- `~/.claude/commands/` (user-scoped — available in every project)

For the workshop we'll use the **project scope** so the commands travel with the workshop folder.

### 1. Create the project commands directory

```bash
# From the workshop root
mkdir -p .claude/commands
```

### 2. Add Agentic QE commands

Create the following files in `.claude/commands/`:

---

## Command: `/security`

**File:** `.claude/commands/security.md`

```markdown
---
name: security
description: Run security analysis on a file or the current context
---

Analyze the following code for security vulnerabilities:

$ARGUMENTS

Focus on:
1. Authentication and authorization issues
2. Input validation and sanitization
3. SQL injection, XSS, and other injection attacks
4. Sensitive data exposure
5. Debug code or test credentials left in production
6. Insecure dependencies or configurations

For each issue found:
- Describe the vulnerability
- Explain the risk (what could an attacker do?)
- Provide a specific fix

If no specific file is provided, analyze the most recently discussed code.
```

---

## Command: `/review`

**File:** `.claude/commands/review.md`

```markdown
---
name: review
description: Perform a thorough code review
---

Perform a comprehensive code review on:

$ARGUMENTS

Evaluate:
1. **Correctness**: Does the code do what it's supposed to?
2. **Security**: Are there any vulnerabilities?
3. **Performance**: Any obvious inefficiencies?
4. **Readability**: Is the code clear and maintainable?
5. **Error Handling**: Are edge cases covered?
6. **Testing**: Is the code testable? Are tests adequate?

Provide feedback in this format:
- 🔴 **Critical**: Must fix before merge
- 🟡 **Suggestion**: Would improve the code
- 💡 **Note**: FYI, optional consideration

Be direct and specific. Don't just point out problems—suggest solutions.
```

---

## Command: `/verify-tests`

**File:** `.claude/commands/verify-tests.md`

```markdown
---
name: verify-tests
description: Verify test quality and coverage
---

Analyze these tests for quality issues:

$ARGUMENTS

Check for:
1. **Weak Assertions**: Tests that pass but don't verify correct behavior
2. **Missing Edge Cases**: Boundaries, nulls, empty values, large inputs
3. **Coincidental Correctness**: Tests that pass for wrong reasons
4. **Test Independence**: Tests that depend on each other or global state
5. **Flakiness Risk**: Timing dependencies, external services, randomness
6. **Coverage Gaps**: Code paths without corresponding tests

For each issue:
- Quote the problematic test
- Explain why it's problematic
- Suggest a better test

Focus on test quality, not just coverage numbers.
```

---

## Command: `/spec-check`

**File:** `.claude/commands/spec-check.md`

```markdown
---
name: spec-check
description: Validate requirements for contradictions and ambiguity
---

Analyze this specification/requirements document:

$ARGUMENTS

Identify:
1. **Contradictions**: Requirements that conflict with each other
2. **Ambiguities**: Vague terms, undefined behavior, missing details
3. **Incompleteness**: Missing requirements, undefined edge cases
4. **Testability**: Requirements that can't be objectively verified
5. **Numeric Inconsistencies**: Math that doesn't add up (e.g., uptime vs maintenance windows)

For each issue:
- Quote the conflicting/problematic requirements
- Explain the conflict or ambiguity
- Suggest a resolution or clarification needed

Be thorough—contradictions often hide in seemingly unrelated sections.
```

---

## Command: `/hallucination-check`

**File:** `.claude/commands/hallucination-check.md`

```markdown
---
name: hallucination-check
description: Verify AI-generated code for hallucinated APIs or patterns
---

This code may have been AI-generated. Check for hallucinations:

$ARGUMENTS

Verify:
1. **API Endpoints**: Do these URLs/endpoints actually exist?
2. **Parameter Names**: Are these the correct parameter names for this API?
3. **Response Structures**: Does the API actually return data in this format?
4. **Library Methods**: Do these methods exist with these signatures?
5. **Configurations**: Are these valid configuration options?
6. **Logical Flow**: Does the code make sense (e.g., using data before it's fetched)?

For each potential hallucination:
- Flag the suspicious code
- Explain why it might be hallucinated
- Suggest how to verify (documentation link, test approach)

AI-generated code often looks plausible but uses invented APIs or wrong parameters.
```

---

## Command: `/quick-check`

**File:** `.claude/commands/quick-check.md`

```markdown
---
name: quick-check
description: Fast quality check for a file (30-second scan)
---

Quick quality scan of:

$ARGUMENTS

In under 30 seconds, identify the TOP 3 most important issues in these categories:
- 🔒 Security risk
- 🐛 Likely bug
- ⚠️ Code smell

Be concise. One sentence per issue. Include line numbers.

Format:
🔒 Line 42: Auth bypass via debug flag
🐛 Line 87: Null check missing before access
⚠️ Line 15: Magic number should be constant

Only flag significant issues. If the code looks solid, say so briefly.
```

---

## Usage Examples

### In Claude Code Terminal

```bash
# Check a specific file for security issues
/security src/api/auth.ts

# Review the code we just discussed
/review

# Verify tests are actually testing the right things
/verify-tests tests/cart.test.ts

# Check a spec document for contradictions
/spec-check docs/requirements.md

# Quick check before committing
/quick-check src/utils/parser.ts

# Check if AI-generated code has hallucinations
/hallucination-check generated/weather-api.ts
```

### In Conversation Context

```
User: Here's my authentication middleware:
[paste code]

User: /security

Claude: [Analyzes the pasted code for security issues]
```

---

## Workshop Exercise

### Step 1: Install the Commands

Create `.claude/commands/` at the workshop root and add each command above as its own `.md` file (filename = command name). For example:

```bash
# From the workshop root
mkdir -p .claude/commands

# Then create files manually with your editor, e.g.:
#   .claude/commands/security.md
#   .claude/commands/review.md
#   .claude/commands/verify-tests.md
#   .claude/commands/spec-check.md
#   .claude/commands/hallucination-check.md
#   .claude/commands/quick-check.md
```

Each file uses the YAML-frontmatter format shown earlier in this document.

### Step 2: Test on Buggy Samples

```bash
# Start Claude Code from the workshop root
claude

# Then inside the Claude Code session, run:
/security workshop-samples/buggy-samples/01-api-auth-bypass.ts
/verify-tests workshop-samples/buggy-samples/02-tests-wrong-behavior.ts
/spec-check workshop-samples/buggy-samples/03-spec-contradictions.md
/hallucination-check workshop-samples/buggy-samples/04-hallucinated-api.ts
```

### Step 3: Compare Results

How do the slash command results compare to:
- Your manual review?
- The answer keys in each file?

---

## Creating Custom Commands

### Template

```markdown
---
name: your-command-name
description: What it does (shown in help)
---

Your prompt here.

$ARGUMENTS will be replaced with whatever follows the command.

Be specific about:
- What to analyze
- What format to use for output
- What to focus on
```

### Tips

1. **Be Specific**: Vague prompts get vague results
2. **Structure Output**: Define the format you want
3. **Set Priorities**: Tell the agent what matters most
4. **Include Examples**: Show the output format you expect
5. **Keep It Focused**: One command, one purpose

---

## PACT Alignment

| Principle | How Commands Implement It |
|-----------|--------------------------|
| **Proactive** | Run `/quick-check` before every commit |
| **Autonomous** | Commands work independently without setup |
| **Collaborative** | Output designed for human decision-making |
| **Targeted** | Each command focuses on specific quality aspect |

---

## Next Steps

1. Customize commands for your team's standards
2. Add project-specific checks (e.g., `/check-api-contracts`)
3. Create compound commands for your workflow
4. Share commands with your team via dotfiles repo

---

## Combining with Agentic QE

These slash commands cover analysis tasks AQE doesn't expose as CLI subcommands (test-quality verification, spec contradictions, hallucination detection). For everything else, use the real `aqe` CLI:

| Need | Tool |
|------|------|
| Security SAST/DAST scan | `aqe security --sast --target src/` |
| URL safety / PII | `aqe security --url-validate <url>` |
| Code complexity | `aqe code complexity src/` |
| Coverage gaps | `aqe coverage --gaps src/` |
| Quality gate | `aqe quality --gate` |
| Test generation | `aqe test generate <file>` |
| Verify test quality | `/verify-tests` (this doc) |
| Spec contradictions | `/spec-check` (this doc) |
| Hallucinated APIs | `/hallucination-check` (this doc) |

---

*Slash commands require Claude Code (`npm install -g @anthropic-ai/claude-code`). Real-CLI checks require Agentic QE (`npm install -g agentic-qe`). Both are pre-installed by `.devcontainer/install-tools.sh`.*
