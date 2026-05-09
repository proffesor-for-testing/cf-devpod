# Workshop Samples

**Quality Engineering in the Agentic Age: Build, Test, Orchestrate**
Craft Conference 2026 | 90-Minute Hands-On Workshop

---

## Directory Structure

```
workshop-samples/
├── buggy-samples/           # TEST phase artifacts
│   ├── 01-api-auth-bypass.ts
│   ├── 02-tests-wrong-behavior.ts
│   ├── 03-spec-contradictions.md
│   └── 04-hallucinated-api.ts
│
├── integration-demos/       # ORCHESTRATE phase patterns
│   ├── 01-github-action.yml
│   ├── 02-vscode-tasks.json
│   ├── 03-cli-commands.sh
│   └── 04-claude-code-commands.md
│
└── README.md               # This file
```

---

## Tools You'll Use

| Tool | Install | Purpose |
|------|---------|---------|
| **Agentic QE** (`aqe`) | `npm install -g agentic-qe` | Code complexity, coverage gaps, quality gates, URL safety |
| **Claude Code** (`claude`) | `npm install -g @anthropic-ai/claude-code` | Conversational analysis via 55 specialized **`@qe-...` agents** installed by `aqe init` |
| **TypeScript** (`tsc`) | `npm install -g typescript` | Required by `aqe code index` for AST analysis |

All three are pre-installed inside the workshop devcontainer. Verify:

```bash
aqe --version       # 3.9.x or newer
claude --version
tsc --version
```

> **First time?** Run `aqe init --auto --minimal` once at the workshop root. It installs the 55 `@qe-...` Claude Code agents into `.claude/agents/v3/` and configures the MCP server. Without this step, `@qe-...` agent names won't be recognized in Claude Code.

---

## Buggy Samples (TEST Phase)

Each sample contains an intentional bug. The flow is:

1. **AQE flags the *shape* of the problem** with a fast deterministic check (`aqe coverage --gaps` or `aqe code complexity`).
2. **A specialized `@qe-...` agent finds the actual bug** in Claude Code.
3. **You compare** — what did each tool catch that you missed?

| # | File | Bug | AQE preface | Agent (in Claude Code) |
|---|------|-----|-------------|------------------------|
| 1 | `01-api-auth-bypass.ts` | Debug flag bypasses auth | `aqe coverage --gaps` flags `missing-security-check: Cover auth bypass and injection attacks` | `@qe-security-scanner` |
| 2 | `02-tests-wrong-behavior.ts` | Tests pass but verify nothing | `aqe code complexity` shows cyclomatic 16, "Estimated bugs: 3.883" | `@qe-mutation-tester` |
| 3 | `03-spec-contradictions.md` | 11 contradictions in requirements | (no AQE preface — pure requirements analysis) | `@qe-requirements-validator` |
| 4 | `04-hallucinated-api.ts` | AI-generated code with fake APIs | `aqe code complexity` shows hotspots | `@qe-code-reviewer` |

### Step 0 — One-time setup (run once from the workshop root)

```bash
# Inside the workshop folder:
aqe init --auto --minimal     # installs 55 @qe-... agents into .claude/agents/v3/
```

### Step 1 — Run the AQE preface

```bash
# Coverage gaps — flags WHICH file is risky and WHY
aqe coverage --gaps --threshold 80 workshop-samples/buggy-samples/

# Complexity — shows hotspots
aqe code complexity workshop-samples/buggy-samples/
```

### Step 2 — Hand each sample to its specialist agent inside Claude Code

```bash
# Start a Claude Code session at the workshop root
claude
```

Then in the Claude Code prompt:

```
@qe-security-scanner  Review workshop-samples/buggy-samples/01-api-auth-bypass.ts.
                      Identify any authorization bypass paths. Quote the line(s),
                      explain the impact, propose a fix.

@qe-mutation-tester   Audit workshop-samples/buggy-samples/02-tests-wrong-behavior.ts.
                      Which tests pass but don't actually verify behavior? For each weak
                      test, quote it and propose a stronger assertion.

@qe-requirements-validator  Read workshop-samples/buggy-samples/03-spec-contradictions.md.
                            List every contradiction, ambiguity, and numeric inconsistency.
                            Quote each conflicting pair.

@qe-code-reviewer     Review workshop-samples/buggy-samples/04-hallucinated-api.ts.
                      The code is AI-generated. Verify every URL, parameter name,
                      and response field against the real OpenWeatherMap docs.
                      Flag anything that looks invented.
```

### Workshop Exercise (per sample, ~5 min)

1. **Manual review** (1 min) — Look at the file yourself. What do you find?
2. **AQE preface** (30 sec) — Run the `aqe ...` command from the table. What does it surface?
3. **Specialist agent** (2 min) — Send the prompt above. What does the agent catch?
4. **Compare** (90 sec) — What did the agent find that you missed? What did you catch that the agent missed?

---

## Integration Demos (ORCHESTRATE Phase)

Four ways to wire AQE + Claude Code into a real workflow.

| # | File | Pattern | Use Case |
|---|------|---------|----------|
| 1 | `01-github-action.yml` | CI/CD | Coverage gaps + complexity + quality gate on every PR |
| 2 | `02-vscode-tasks.json` | IDE | VS Code Command Palette tasks |
| 3 | `03-cli-commands.sh` | Terminal | Pipelines, Makefile targets, pre-commit |
| 4 | `04-claude-code-commands.md` | Claude Code | Project-scoped slash commands (alternative to `@qe-...` agents) |

### What we use AQE for

```bash
aqe coverage --gaps --threshold 80 src/   # phantom-gap detection (Ghost Intent Coverage)
aqe code complexity src/                  # cyclomatic, cognitive, Halstead bug estimate
aqe code deps src/                        # dependency graph
aqe code index src/                       # build searchable AST index
aqe quality --gate                        # 7-check pass/fail verdict
aqe security --url-validate <url>         # URL + PII safety check
```

### What we use Claude Code agents for

Anything requiring judgment: security review, test-quality verification, spec analysis, hallucinated-API detection, refactoring proposals. Invoke with `@qe-<agent-name>` inside a Claude Code session.

The 55 installed agents are listed in `.claude/agents/v3/` after `aqe init`. The ones we use today:

| Agent | Specialty |
|-------|-----------|
| `@qe-security-scanner` | SAST/DAST/dep scanning, secrets, OWASP |
| `@qe-mutation-tester` | Test-suite effectiveness, weak-assertion detection |
| `@qe-requirements-validator` | Acceptance-criteria testability, contradiction detection |
| `@qe-code-reviewer` | Quality, maintainability, standards compliance |

### Commands we deliberately don't show

- `aqe security --sast / --dast / --compliance` — current build doesn't surface findings reliably; for security review use `@qe-security-scanner` instead
- `aqe test generate` — produces non-compiling output for files whose names aren't valid JS identifiers (e.g. anything with hyphens or leading digits). **Experimental.** If you want to try, copy the source to a clean filename first
- `aqe code search` — index-based semantic search currently returns 0 hits for our buggy samples

---

## PACT Alignment

| Pattern | Proactive | Autonomous | Collaborative | Targeted |
|---------|-----------|------------|---------------|----------|
| GitHub Action  | Runs before merge | No human trigger | Comments on the PR | PR scope only |
| VS Code Tasks  | Pre-commit task | Background-friendly | Output panels | `${file}` / `${fileDirname}` |
| CLI            | Pre-commit hooks | Scriptable, pipeable | Markdown / JSON outputs | `--target` arg |
| Claude Code    | In-conversation | Agents work autonomously | Dialogue format | Context-aware via `@qe-...` |

---

## Workshop Flow

### TEST Phase (30 min)

1. Step 0 — `aqe init --auto --minimal` (live, 30 sec) → 55 agents installed
2. Introduce buggy samples (5 min)
3. Hands-on with AQE prefaces + `@qe-...` agents (15 min)
4. Compare findings (5 min)
5. Debrief (5 min)

### ORCHESTRATE Phase (20 min)

1. PACT principles (5 min)
2. Demo: multi-agent CI/CD (7 min)
3. Integration options (6 min)
4. Choose your path (2 min)

---

## Instructor Notes

### Timing tips

- The `aqe init` step is the only one with non-trivial install time (~10 sec post-cold-start). Run it during the slide intro so it's done before hands-on.
- Buggy samples: 3–4 minutes per sample is plenty.
- Don't reveal answer keys until the discussion at the end of each sample.
- The `aqe coverage --gaps` Ghost Intent demo on sample 1 is a strong opener — it points at "auth bypass and injection attacks" before any agent has read the file.

### Common questions

**Q: Why use AQE at all if Claude Code agents do the heavy lifting?**
A: Different speeds. AQE is deterministic and instant — perfect for CI gates and pre-commit hooks. Agents are slower but reason about meaning. The pattern is *AQE narrows where to look, agents look*. You don't pay token cost on every commit; you pay it on the few files AQE flags.

**Q: Why don't we use `aqe security --sast`?**
A: In the current build it doesn't surface findings reliably even on synthetic test cases (hardcoded credentials, `eval(userInput)`, command injection). The `@qe-security-scanner` agent does. We're showing what works today.

**Q: Won't this make testers obsolete?**
A: No — it makes them more effective. Agents handle routine checks; humans focus on judgment, exploration, and deciding what's worth automating.

**Q: How much does this cost?**
A: A typical `@qe-...` invocation costs $0.01–$0.05 in Claude API calls. AQE CLI calls are free. A full workshop session burns well under $1 per attendee.

---

## License

MIT License. Use freely in your workshops and teams.

---

*Prepared for Craft Conference 2026 by Dragan Spiridonov, Quantum Quality Engineering.*
