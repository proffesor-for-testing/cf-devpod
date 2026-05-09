# Integration Demo #4: Claude Code — Agents vs Slash Commands

**Workshop: Quality Engineering in the Agentic Age**
**Phase: ORCHESTRATE**

Claude Code has two complementary ways to inject quality engineering into a session:

| Mechanism | Where it lives | When to use |
|-----------|----------------|-------------|
| **`@qe-...` agents** | `.claude/agents/v3/` (installed by `aqe init`) | Specialized reasoning — security, mutation testing, requirements validation, code review |
| **Slash commands** | `.claude/commands/*.md` (you write them) | Repeatable prompts your whole team uses — quick check before commit, custom org rules |

**The workshop primarily uses `@qe-...` agents** because they ship pre-built and pre-trained for QE tasks. Slash commands are a useful customization layer on top.

---

## Setup

### 1. Install the `@qe-...` agents (one-time per project)

```bash
# At the workshop root
aqe init --auto --minimal
```

This installs **55 specialist agents** into `.claude/agents/v3/`. They become invokable in any Claude Code session opened in this directory.

```bash
ls .claude/agents/v3/ | head -10
# qe-accessibility-auditor.md
# qe-bdd-generator.md
# qe-chaos-engineer.md
# qe-code-complexity.md
# qe-code-intelligence.md
# qe-code-reviewer.md
# qe-coverage-specialist.md
# qe-defect-predictor.md
# qe-dependency-mapper.md
# qe-deployment-advisor.md
```

### 2. (Optional) Add custom slash commands

```bash
# Project-scoped — checked in with the repo
mkdir -p .claude/commands
```

Then create files like `.claude/commands/quick-check.md` with the YAML-frontmatter format shown later in this document.

---

## Agents we use in the workshop

| Agent | Specialty | Used for sample |
|-------|-----------|-----------------|
| `@qe-security-scanner` | SAST/DAST/dep scanning, secrets, OWASP coverage | `01-api-auth-bypass.ts` |
| `@qe-mutation-tester` | Test-suite effectiveness, weak-assertion detection | `02-tests-wrong-behavior.ts` |
| `@qe-requirements-validator` | Acceptance-criteria testability, contradiction detection | `03-spec-contradictions.md` |
| `@qe-code-reviewer` | Quality, maintainability, standards compliance | `04-hallucinated-api.ts` |

### Invoking an agent

Inside a Claude Code session:

```
@qe-security-scanner Review workshop-samples/buggy-samples/01-api-auth-bypass.ts.
                     Identify any authorization bypass paths. Quote the line(s),
                     explain the impact, propose a fix.
```

Headless from the shell:

```bash
claude -p "@qe-security-scanner Review workshop-samples/buggy-samples/01-api-auth-bypass.ts. Identify any authorization bypass paths. Quote the line(s), explain the impact, propose a fix."
```

The agent reads the file, reasons about it, and returns a structured response. You can chain more turns by continuing the conversation.

---

## Buggy-Samples Walkthrough (TEST phase)

Run the AQE preface first, then hand each sample to its agent:

```bash
# Step 1 — AQE preface (free, deterministic, fast)
aqe coverage --gaps --threshold 80 workshop-samples/buggy-samples/
aqe code complexity workshop-samples/buggy-samples/

# Step 2 — Specialist agents (in a Claude Code session, or via -p)
claude -p "@qe-security-scanner Review workshop-samples/buggy-samples/01-api-auth-bypass.ts. Identify any auth bypass. Quote the line(s)."
claude -p "@qe-mutation-tester Audit workshop-samples/buggy-samples/02-tests-wrong-behavior.ts. Quote each weak test, propose a stronger assertion."
claude -p "@qe-requirements-validator Read workshop-samples/buggy-samples/03-spec-contradictions.md. List every contradiction, ambiguity, numeric inconsistency."
claude -p "@qe-code-reviewer Review workshop-samples/buggy-samples/04-hallucinated-api.ts. Verify every URL, parameter, and field against real APIs. Flag invented ones."
```

---

## Custom Slash Commands (optional layer)

If your team has repeatable prompts beyond what the `@qe-...` agents cover, codify them as slash commands. They live in `.claude/commands/<name>.md` (project) or `~/.claude/commands/<name>.md` (user-global).

### Template

```markdown
---
name: your-command-name
description: One-line description shown in /help
---

Your prompt here.

$ARGUMENTS  is replaced with whatever follows the command.

Be specific about:
- What to analyze
- What output format you want
- What to focus on
```

### Example: `/quick-check`

**File:** `.claude/commands/quick-check.md`

```markdown
---
name: quick-check
description: Fast 30-second quality check on a file
---

Quick quality scan of:

$ARGUMENTS

In under 30 seconds, identify the TOP 3 most important issues:
- 🔒 Security risk
- 🐛 Likely bug
- ⚠️ Code smell

One sentence per issue. Include line numbers.

Format:
🔒 Line 42: Auth bypass via debug flag
🐛 Line 87: Null check missing before access
⚠️ Line 15: Magic number should be constant

If the code looks solid, say so briefly.
```

Usage inside Claude Code:

```
/quick-check src/utils/parser.ts
```

### When slash commands beat agents

- **Org-specific conventions** — "Check this against our internal API style guide"
- **Quick filters** — `/quick-check` returns 3 lines, not a structured report
- **Team-wide standardization** — checked into the repo, every dev gets the same commands
- **Composing several agents** — "First run @qe-security-scanner, then @qe-mutation-tester on its output"

### When agents beat slash commands

- **Specialist domain knowledge** — `@qe-mutation-tester` knows mutation operators; you'd have to teach a slash command those
- **Multi-turn reasoning** — agents can converse, slash commands fire-and-forget
- **No prompt engineering needed** — the agent already knows what good output looks like

---

## Combining With Agentic QE

| Need | Tool | Rationale |
|------|------|-----------|
| Coverage gaps / phantom-gap detection | `aqe coverage --gaps` | Free, deterministic, instant |
| Code complexity, hotspots | `aqe code complexity` | No tokens, exact metrics |
| Dependency map | `aqe code deps` | Same |
| Quality gate verdict | `aqe quality --gate` | Same |
| URL safety check | `aqe security --url-validate` | Same |
| Security review (auth, injection, OWASP) | `@qe-security-scanner` | Reasoning required |
| Test-suite quality audit | `@qe-mutation-tester` | Reasoning required |
| Spec contradiction detection | `@qe-requirements-validator` | Reasoning required |
| Code review (hallucinations, judgment) | `@qe-code-reviewer` | Reasoning required |

The mental model: **AQE narrows where to look, agents look.** You don't pay per-token cost on every commit — you pay it on the few files AQE flags.

---

## PACT Alignment

| Principle | How agents implement it |
|-----------|--------------------------|
| **Proactive** | Run agents in pre-PR Actions; bind quick-check tasks to keyboard shortcuts |
| **Autonomous** | Each agent invocation is independent — chain them with shell pipes |
| **Collaborative** | Markdown output is built for humans; PR comments preserve context |
| **Targeted** | `@<agent>` + a precise prompt scopes to exactly the task at hand |

---

*Both agents and slash commands require Claude Code (`npm install -g @anthropic-ai/claude-code`). Agents additionally require `aqe init` (`npm install -g agentic-qe` first). Both are pre-installed by `.devcontainer/install-tools.sh`.*
