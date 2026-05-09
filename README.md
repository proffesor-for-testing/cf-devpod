# Craft Conference 2026 — Agentic QE Workshop

**Quality Engineering in the Agentic Age: Build, Test, Orchestrate**
90-minute hands-on workshop · Budapest 2026

This branch of [`proffesor-for-testing/cf-devpod`](https://github.com/proffesor-for-testing/cf-devpod) is the workshop environment. Open it in **GitHub Codespaces** for the easiest path, or run it locally with **DevPod** / Docker — both are covered below.

---

## What's in this branch

```
.
├── .devcontainer/
│   ├── devcontainer.json     # Codespaces + DevPod config
│   ├── install-tools.sh      # Installs Claude Code, agentic-qe, gh, tmux, ccusage
│   └── welcome.md            # Banner shown on every shell start
└── workshop-samples/
    ├── buggy-samples/        # 4 files with intentional bugs (TEST phase)
    └── integration-demos/    # GitHub Action / VS Code / CLI / Claude Code (ORCHESTRATE phase)
```

The devcontainer auto-installs everything you need. You only have to do **one manual step** — authenticate Claude Code (see below).

---

## Quick start — GitHub Codespaces (recommended)

1. Click the green **Code** button on this branch → **Codespaces** tab → **Create codespace**.
2. Wait ~2–3 minutes for `install-tools.sh` to finish. You'll see a tool-by-tool report at the end.
3. In the terminal, authenticate Claude Code:
   ```bash
   claude /login
   ```
   Sign in with your Claude.ai Pro/Max subscription, **or** paste an API key from <https://console.anthropic.com/>.
4. Verify both tools work:
   ```bash
   aqe --version       # 3.9.x or newer
   claude "say hello"
   ```

That's it — open `workshop-samples/README.md` and start with the buggy samples.

---

## Quick start — DevPod / local Docker

If you'd rather not use Codespaces:

1. Install [DevPod](https://devpod.sh) (or use any IDE that supports devcontainers — VS Code, IntelliJ, etc.).
2. Clone this branch:
   ```bash
   git clone -b <this-branch-name> https://github.com/proffesor-for-testing/cf-devpod.git
   cd cf-devpod
   ```
3. Open with DevPod / VS Code Dev Containers — it will detect `.devcontainer/devcontainer.json` and build the environment.
4. Once inside the container, run `claude /login` as above.

The container is the same Debian 12 base as the [`qe-ruvector`](https://github.com/proffesor-for-testing/qe-ruvector) devpod, so the experience matches your day-job setup.

---

## What gets installed

`install-tools.sh` (run by `postCreateCommand`) installs:

| Tool | Package | Purpose |
|------|---------|---------|
| **Claude Code** | `@anthropic-ai/claude-code` | AI-powered development CLI; host for the 55 `@qe-...` agents |
| **Agentic QE** | `agentic-qe` (binary: `aqe`) | Coverage gaps, complexity, dependency graph, quality gate, URL safety |
| **TypeScript** | `typescript` | Required by `aqe code index` for AST analysis |
| **GitHub CLI** | `gh` | PR / repo workflows |
| **tmux** | apt | Terminal multiplexing |
| **ccusage** | `ccusage` | Token spend visibility |

It also seeds workshop aliases into `~/.zshrc` and `~/.bashrc`:

```bash
aqe-cov PATH      # aqe coverage --gaps --threshold 80 --target PATH
aqe-complex PATH  # aqe code complexity PATH
aqe-deps PATH     # aqe code deps PATH
aqe-gate          # aqe quality --gate
aqe-url URL       # aqe security --url-validate URL

ws | samples | buggy   # cd to workshop locations
cc                     # alias for `claude`
```

> The aliases reflect commands that **work today**. We deliberately don't alias `aqe security --sast`, `aqe test generate`, or `aqe code search` — see `workshop-samples/README.md` for why.

The full report (success/failure per tool, manual install instructions for failures) is written to `.devcontainer/installation-report.md` after setup.

---

## Workshop flow (90 min)

### Part 1 — BUILD (warm-up, ~10 min)
A short walkthrough of how AQE agents are structured. No hands-on yet.

### Part 2 — TEST (30 min) → `workshop-samples/buggy-samples/`
Each file contains an intentional bug. The flow is: **AQE flags the *shape* of the problem first, then a specialist Claude Code agent finds the actual bug.**

| File | Bug | AQE preface | Specialist agent |
|------|-----|-------------|------------------|
| `01-api-auth-bypass.ts` | Debug flag bypasses auth | `aqe coverage --gaps` flags `missing-security-check: Cover auth bypass` | `@qe-security-scanner` |
| `02-tests-wrong-behavior.ts` | Tests pass but don't verify | `aqe code complexity` shows cyclomatic 16 | `@qe-mutation-tester` |
| `03-spec-contradictions.md` | 11 contradictions in requirements | (none — pure requirements analysis) | `@qe-requirements-validator` |
| `04-hallucinated-api.ts` | AI-generated code with fake APIs | `aqe code complexity` shows hotspots | `@qe-code-reviewer` |

> **Why two tools?** AQE is deterministic and free — perfect for fast CI gates and pre-commit hooks. Claude Code agents reason about meaning. The pattern is **AQE narrows where to look, agents look**. You only pay token cost on the few files AQE flags. The `@qe-...` agents (55 of them) are installed by running `aqe init --auto --minimal` once at the workshop root.

### Part 3 — ORCHESTRATE (20 min) → `workshop-samples/integration-demos/`
Four ways to wire these tools into a real workflow:

| File | Pattern |
|------|---------|
| `01-github-action.yml` | CI/CD — install `agentic-qe`, run SAST + SARIF upload + quality gate |
| `02-vscode-tasks.json` | IDE — VS Code tasks bound to keyboard shortcuts |
| `03-cli-commands.sh` | Terminal — pipelines, Makefile targets, pre-commit |
| `04-claude-code-commands.md` | Claude Code — project-scoped slash commands in `.claude/commands/` |

### Part 4 — Discussion (~30 min)
PACT principles, cost vs. value, what to take back to your team.

---

## Troubleshooting

### `aqe: command not found`
The install script's report is at `.devcontainer/installation-report.md`. If `agentic-qe` failed, install manually:
```bash
npm install -g agentic-qe
# or with sudo if EACCES:
sudo npm install -g agentic-qe
```

### `claude: command not found`
Same idea:
```bash
npm install -g @anthropic-ai/claude-code
```

### `claude /login` doesn't open a browser (Codespaces / headless)
Claude Code will print a URL — copy it into your local browser, complete the flow, and paste the resulting code back into the terminal. Or set the `ANTHROPIC_API_KEY` env var directly:
```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

### Workshop aliases (`aqe-sec`, etc.) aren't loaded
They're appended to `~/.zshrc` and `~/.bashrc`. Either start a new shell, or:
```bash
source ~/.zshrc
```

### Anything else
- Workshop email: **dragan@quantum-qe.dev**
- Or raise your hand — we're in the room.

---

## What this branch is **not**

- It's not the source code for `agentic-qe`. That lives at <https://github.com/proffesor-for-testing/agentic-qe> (the npm package `agentic-qe`).
- It's not a long-lived fork of `cf-devpod`. The branch name (`craft-2026` or whatever it ends up as) is the only thing that distinguishes it from the main `cf-devpod` setup.
- The `aqe-fleet` binary referenced in some older drafts of these materials does **not exist**. The real CLI is `aqe`. If a command in your notes uses `aqe-fleet`, replace it with `aqe`.

---

## License

MIT. Use, fork, share freely.

*Prepared by Dragan Spiridonov, Quantum Quality Engineering, for Craft Conference 2026 in Budapest.*
