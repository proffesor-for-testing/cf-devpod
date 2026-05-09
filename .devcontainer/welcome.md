```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   🎯 Welcome to the Agentic QE Workshop!                                     ║
║                                                                              ║
║   Quality Engineering in the Agentic Age: Build, Test, Orchestrate           ║
║   Craft Conference 2026                                                      ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│  🔑 FIRST: Authenticate Claude Code                                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Run this command in the terminal:                                           │
│                                                                              │
│    claude /login                                                             │
│                                                                              │
│  Then either:                                                                │
│    • Sign in with your Claude.ai Pro/Max subscription, or                    │
│    • Paste an API key from https://console.anthropic.com/                    │
│                                                                              │
│  Verify it works:                                                            │
│                                                                              │
│    claude "say hello"                                                        │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  ✅ Verify Agentic QE                                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    aqe --version       # should print 3.9.x                                  │
│    aqe --help          # see all subcommands                                 │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  📁 Workshop Structure                                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  workshop-samples/                                                           │
│  ├── buggy-samples/          ← TEST phase: Find bugs with agents             │
│  │   ├── 01-api-auth-bypass.ts                                               │
│  │   ├── 02-tests-wrong-behavior.ts                                          │
│  │   ├── 03-spec-contradictions.md                                           │
│  │   └── 04-hallucinated-api.ts                                              │
│  │                                                                           │
│  └── integration-demos/      ← ORCHESTRATE phase: Integration patterns       │
│      ├── 01-github-action.yml                                                │
│      ├── 02-vscode-tasks.json                                                │
│      ├── 03-cli-commands.sh                                                  │
│      └── 04-claude-code-commands.md                                          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  ⚡ Quick Aliases (loaded in your shell)                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  buggy           Go to buggy samples directory                               │
│  samples         Go to workshop samples directory                            │
│  ws              Go to workshop root                                         │
│                                                                              │
│  aqe-sec PATH    Security SAST scan on a path                                │
│  aqe-url URL     Validate a URL for security threats / PII                   │
│  aqe-complex P   Code complexity analysis                                    │
│  aqe-deps PATH   Map dependencies                                            │
│  aqe-cov         Coverage analysis                                           │
│  aqe-gate        Quality gate evaluation                                     │
│  aqe-gen FILE    Generate tests for a file                                   │
│  aqe-run FILE    Execute tests for a file                                    │
│                                                                              │
│  cc              Shortcut for `claude`                                       │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  🆘 Need Help?                                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  • Raise your hand — Dragan will come help                                   │
│  • Read workshop-samples/README.md for detailed instructions                 │
│  • Check .devcontainer/installation-report.md if a tool is missing           │
│  • Ask your neighbor — collaboration is encouraged!                          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

Ready? Let's build some agents! 🚀
```
