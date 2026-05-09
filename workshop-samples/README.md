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
| **Agentic QE** (`aqe`) | `npm install -g agentic-qe` | Security SAST, coverage, quality gates, test generation |
| **Claude Code** (`claude`) | `npm install -g @anthropic-ai/claude-code` | Conversational analysis (test quality, spec review, hallucination detection) |

Both are pre-installed inside the workshop devcontainer (see `.devcontainer/install-tools.sh`). Verify:

```bash
aqe --version       # 3.9.x or newer
claude --version
```

> **Heads up:** Agentic QE does **not** ship a `verify-tests`, `spec-validator`, `code-review`, or `scan` subcommand. For those, we use Claude Code with a precise prompt or a slash command (see `integration-demos/04-claude-code-commands.md`). Don't expect `aqe-fleet` — that's a fictional CLI; the real binary is `aqe`.

---

## Buggy Samples (TEST Phase)

These artifacts contain intentional bugs. Each file has an "Answer Key" at the bottom (in comments) — don't peek until you've tried.

| # | File | Bug Type | Tool to use |
|---|------|----------|-------------|
| 1 | `01-api-auth-bypass.ts` | Debug flag bypasses auth | `aqe security --sast` |
| 2 | `02-tests-wrong-behavior.ts` | Tests pass but verify wrong things | Claude Code `/verify-tests` |
| 3 | `03-spec-contradictions.md` | 11 contradictions in requirements | Claude Code `/spec-check` |
| 4 | `04-hallucinated-api.ts` | AI-generated code with fake APIs | Claude Code `/hallucination-check` |

### How to Use

```bash
# 1. Security scan — real aqe CLI
aqe security --sast --target workshop-samples/buggy-samples/

# 2. Verify test quality — Claude Code (start a session, then run the slash command)
claude
> /verify-tests workshop-samples/buggy-samples/02-tests-wrong-behavior.ts

# 3. Spec contradictions
> /spec-check workshop-samples/buggy-samples/03-spec-contradictions.md

# 4. Hallucinated API check
> /hallucination-check workshop-samples/buggy-samples/04-hallucinated-api.ts
```

Slash command setup is in `integration-demos/04-claude-code-commands.md` (create `.claude/commands/*.md` once and they're available everywhere in the project).

### Workshop Exercise

1. **Manual Review** (5 min) — Look at the file yourself. What issues do you find?
2. **Agent Review** (5 min) — Run the corresponding tool above. What does it catch?
3. **Compare** (5 min) — What did the agent find that you missed? What did you catch that the agent missed?
4. **Debrief** — Discuss complementary strengths of human + agent review.

---

## Integration Demos (ORCHESTRATE Phase)

Four ways to integrate Agentic QE + Claude Code into your workflow.

| # | File | Pattern | Use Case |
|---|------|---------|----------|
| 1 | `01-github-action.yml` | CI/CD | Automated PR review with SARIF upload |
| 2 | `02-vscode-tasks.json` | IDE | On-demand tasks bound to VS Code Command Palette |
| 3 | `03-cli-commands.sh` | Terminal | Ad-hoc exploration, pipelines, Makefile targets |
| 4 | `04-claude-code-commands.md` | Claude Code | Project-scoped slash commands |

### GitHub Action

Runs `aqe security --sast` (with SARIF upload), coverage gap analysis, and quality gate on every PR. Posts findings as PR comments.

```yaml
# Install at: .github/workflows/aqe-review.yml
# Requires:   ANTHROPIC_API_KEY repository secret
# Adds:       Findings to the GitHub Security tab via SARIF
```

### VS Code Tasks

Run AQE checks from the Command Palette or a keyboard shortcut.

```json
// Install at: .vscode/tasks.json
// Access:     Cmd/Ctrl+Shift+P → "Tasks: Run Task"
```

### CLI Commands

One-liners for exploration sessions, pre-commit hooks, or Makefile targets.

```bash
# Working examples (all use the real `aqe` binary):
aqe security --sast --target src/
aqe coverage --gaps --threshold 80 src/
aqe quality --gate
aqe test generate src/utils/parser.ts --framework vitest
```

### Claude Code Commands

Project-scoped slash commands stored in `.claude/commands/*.md`.

```
# Inside a Claude Code session:
/security src/api/auth.ts
/review
/verify-tests tests/cart.test.ts
/spec-check docs/requirements.md
/quick-check src/utils/parser.ts
```

---

## PACT Alignment

| Pattern | Proactive | Autonomous | Collaborative | Targeted |
|---------|-----------|------------|---------------|----------|
| GitHub Action  | Runs before merge | No human trigger | Comments + SARIF for review | PR scope only |
| VS Code Tasks  | Pre-commit task | Background-friendly | Output panels | `${file}` / `${fileDirname}` |
| CLI            | Pre-commit hooks | Scriptable, pipeable | Markdown / JSON / SARIF outputs | `--target` arg |
| Claude Code    | In-conversation | Slash commands | Dialogue format | Context-aware |

---

## Workshop Flow

### TEST Phase (30 min)

1. Introduce samples (5 min)
2. Hands-on with agents (15 min) — security via `aqe`, the rest via Claude Code
3. Compare findings (5 min)
4. Debrief (5 min)

### ORCHESTRATE Phase (20 min)

1. PACT principles (5 min)
2. Demo: multi-agent workflow (7 min)
3. Integration options (6 min)
4. Choose your path (2 min)

---

## Instructor Notes

### Timing Tips

- Buggy samples: 3–4 minutes per sample
- Don't reveal answer keys until discussion
- The CLI demo (`aqe security --sast`) is fastest for live presentation
- The GitHub Action is best shown via a pre-recorded PR

### Common Questions

**Q: Why use agents if they don't catch everything?**
A: Complementary strengths. Agents catch what humans miss (consistency, thoroughness). Humans catch what agents miss (context, business logic, intent).

**Q: Won't this make testers obsolete?**
A: No — it makes them more effective. Agents handle routine checks; humans focus on judgment and exploration.

**Q: How much does this cost?**
A: Depends on usage. A typical PR review costs ~$0.05–$0.15 in Claude API calls. Most teams find this trivial compared to bug-escape costs.

**Q: Why doesn't `aqe code-review` exist?**
A: Code review is the kind of judgment task LLMs handle conversationally. Agentic QE focuses on deterministic, scriptable checks (SAST, coverage, gates, generation). For code-review-style analysis we use Claude Code with structured prompts — see `04-claude-code-commands.md`.

---

## License

MIT License. Use freely in your workshops and teams.

---

*Prepared for Craft Conference 2026 by Dragan Spiridonov, Quantum Quality Engineering.*
