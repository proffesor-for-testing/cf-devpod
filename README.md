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
| **Claude Code** | `@anthropic-ai/claude-code` | AI-powered development CLI |
| **Agentic QE** | `agentic-qe` (binary: `aqe`) | Security SAST, coverage, quality gates |
| **GitHub CLI** | `gh` | PR / repo workflows |
| **tmux** | apt | Terminal multiplexing |
| **ccusage** | `ccusage` | Token spend visibility |

It also seeds workshop aliases into `~/.zshrc` and `~/.bashrc`:

```bash
aqe-sec PATH      # aqe security --sast --target PATH
aqe-url URL       # aqe security --url-validate URL
aqe-complex PATH  # aqe code complexity PATH
aqe-deps PATH     # aqe code deps PATH
aqe-cov           # aqe coverage
aqe-gate          # aqe quality --gate
aqe-gen FILE      # aqe test generate FILE
aqe-run FILE      # aqe test execute FILE

ws | samples | buggy   # cd to workshop locations
cc                     # alias for `claude`
```

The full report (success/failure per tool, manual install instructions for failures) is written to `.devcontainer/installation-report.md` after setup.

---

## Workshop flow (90 min)

### Part 1 — BUILD (warm-up, ~10 min)
A short walkthrough of how AQE agents are structured. No hands-on yet.

### Part 2 — TEST (30 min) → `workshop-samples/buggy-samples/`
Each file contains an intentional bug. You'll review manually first, then run an agent, then compare findings:

| File | Bug | Tool |
|------|-----|------|
| `01-api-auth-bypass.ts` | Debug flag bypasses auth | `aqe security --sast` |
| `02-tests-wrong-behavior.ts` | Tests pass but don't verify | Claude Code `/verify-tests` |
| `03-spec-contradictions.md` | 11 contradictions in requirements | Claude Code `/spec-check` |
| `04-hallucinated-api.ts` | AI-generated code with fake APIs | Claude Code `/hallucination-check` |

> **Why two tools?** Agentic QE (`aqe`) handles deterministic, scriptable checks — security SAST, coverage, quality gates, test generation. Tasks that need judgment (test-quality verification, spec contradictions, hallucination detection) we delegate to Claude Code with precise prompts. Both ship in this devcontainer.

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
