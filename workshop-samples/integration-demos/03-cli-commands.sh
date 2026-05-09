#!/bin/bash

# =============================================================================
# INTEGRATION DEMO #3: CLI One-Liners for Ad-Hoc Quality Checks
#
# Workshop: Quality Engineering in the Agentic Age
# Phase: ORCHESTRATE
#
# Two tools, two roles:
#
#   `aqe`    deterministic, fast, free — ideal for CI gates and pre-commit
#            hooks. Used here for: coverage gaps, code complexity, code
#            dependency mapping, quality gate, URL safety.
#
#   Claude   reasons about meaning — used for everything that needs judgment.
#   Code     Invoke specialist agents with `@qe-<agent-name>` inside a
#   agents   `claude` session. Agents are installed by `aqe init`.
#
# This file is a REFERENCE, not a runnable script. Copy individual lines.
# Verify your tools first:
#   aqe --version            # 3.9.x or newer
#   claude --version
#   tsc --version            # required by `aqe code index`
# =============================================================================

# -----------------------------------------------------------------------------
# 0. ONE-TIME SETUP (run once per project)
# -----------------------------------------------------------------------------

# Initialize AQE — installs 55 @qe-... Claude Code agents into .claude/agents/v3/
# Also creates .agentic-qe/ memory store and .mcp.json
# aqe init --auto --minimal

# -----------------------------------------------------------------------------
# 1. AQE — DETERMINISTIC CHECKS
# -----------------------------------------------------------------------------

# Coverage analysis with Ghost Intent Coverage (ADR-059): phantom-gap detection
# flags categories of missing tests (e.g. "missing-security-check") even
# without coverage data. This is the strongest demo on a fresh codebase.
aqe coverage --gaps --threshold 80 src/

# Code complexity — cyclomatic, cognitive, Halstead bug estimate, hotspots
aqe code complexity src/

# Dependency graph (nodes, edges, depth)
aqe code deps src/

# Build a searchable AST index for the codebase
aqe code index src/

# Quality gate — 7-check pass/fail verdict (coverage, tests passing, critical
# bugs, code smells, security vulnerabilities, technical debt, duplications)
aqe quality --gate

# URL + PII safety check (good for validating external links in docs/CI)
aqe security --url-validate https://example.com

# -----------------------------------------------------------------------------
# 2. CLAUDE CODE AGENTS — JUDGMENT TASKS
# -----------------------------------------------------------------------------
#
# Start a Claude Code session at the project root, then use `@qe-<name>` to
# invoke a specialist agent with full project context:
#
#   claude
#   > @qe-security-scanner Review src/api/auth.ts for auth bypass and
#                          injection. Quote the offending lines.
#
# Or, headless from the shell, use `claude -p` with the agent listed in the
# prompt:
#
#   claude -p "@qe-security-scanner review src/api/auth.ts ..."
#
# Specialist agents we use in this workshop (see .claude/agents/v3/):
#   @qe-security-scanner       SAST/DAST/dep scanning, secrets, OWASP
#   @qe-mutation-tester        Test-suite effectiveness, weak-assertion detection
#   @qe-requirements-validator Spec contradiction & ambiguity detection
#   @qe-code-reviewer          Quality, maintainability, standards compliance

# Security review of changed code (from inside `claude`)
claude -p "@qe-security-scanner Review src/api/auth.ts. Identify any auth bypass paths or injection risk. Quote the line(s), explain impact, propose a fix."

# Test-quality audit — does the test actually verify the behaviour?
claude -p "@qe-mutation-tester Audit tests/cart.test.ts. Which tests pass but don't actually verify behavior? Quote each weak test and propose a stronger assertion."

# Spec contradiction check
claude -p "@qe-requirements-validator Read docs/requirements.md. List every contradiction, ambiguity, and numeric inconsistency. Quote each conflicting pair."

# Hallucinated-API check on AI-generated code
claude -p "@qe-code-reviewer Review src/integrations/weather.ts. The code is AI-generated. Verify every URL, parameter name, and response field against the real OpenWeatherMap docs. Flag anything that looks invented."

# -----------------------------------------------------------------------------
# 3. OUTPUT FORMATS AND PIPELINES
# -----------------------------------------------------------------------------

# JSON for filtering with jq
aqe coverage --gaps -F json src/ | jq '.gaps[] | select(.severity == "critical")'

# Markdown report for sharing
aqe quality --gate -F markdown -o quality-report.md
aqe coverage --gaps -F markdown -o coverage-gaps.md src/

# -----------------------------------------------------------------------------
# 4. COMPOSED PIPELINES
# -----------------------------------------------------------------------------

# Pre-commit: run the gate, fail the commit if it doesn't pass
aqe quality --gate || { echo "Quality gate failed"; exit 1; }

# Show complexity hotspots only above threshold (rough filter via grep)
aqe code complexity src/ | grep -E "Cyclomatic: ([1-9][0-9]|[2-9][0-9]+)"

# Run the agent on each file changed in last commit
git diff --name-only HEAD~1 -- '*.ts' '*.js' | while read f; do
    [ -f "$f" ] || continue
    claude -p "@qe-code-reviewer Review $f. Flag the top 3 issues with line numbers."
done

# -----------------------------------------------------------------------------
# 5. WORKSHOP EXERCISE COMMANDS
# -----------------------------------------------------------------------------
# Run from the workshop root (one level up from this file).

# Step 1 — AQE preface: identify which file is risky and why
aqe coverage --gaps --threshold 80 workshop-samples/buggy-samples/
aqe code complexity workshop-samples/buggy-samples/

# Step 2 — Hand each sample to its specialist agent (inside `claude`)
#
# claude
# > @qe-security-scanner       Review workshop-samples/buggy-samples/01-api-auth-bypass.ts.
#                              Identify any authorization bypass paths.
# > @qe-mutation-tester        Audit workshop-samples/buggy-samples/02-tests-wrong-behavior.ts.
#                              Which tests pass but don't verify the right thing?
# > @qe-requirements-validator Read workshop-samples/buggy-samples/03-spec-contradictions.md.
#                              List every contradiction.
# > @qe-code-reviewer          Review workshop-samples/buggy-samples/04-hallucinated-api.ts.
#                              Verify every URL/parameter/field against real docs.

# Or headless:
claude -p "@qe-security-scanner Review workshop-samples/buggy-samples/01-api-auth-bypass.ts. Identify any authorization bypass paths. Quote the line(s)."
claude -p "@qe-mutation-tester Audit workshop-samples/buggy-samples/02-tests-wrong-behavior.ts. Which tests pass but don't verify the right thing? For each weak test, quote it and propose a stronger assertion."
claude -p "@qe-requirements-validator Read workshop-samples/buggy-samples/03-spec-contradictions.md. List every contradiction, ambiguity, and numeric inconsistency."
claude -p "@qe-code-reviewer Review workshop-samples/buggy-samples/04-hallucinated-api.ts. The code is AI-generated. Verify every URL, parameter name, and response field against real APIs. Flag anything invented."

# =============================================================================
# WORKSHOP ALIASES (auto-loaded by install-tools.sh)
# =============================================================================
#
# alias aqe-cov="aqe coverage --gaps --threshold 80 --target"
# alias aqe-complex="aqe code complexity"
# alias aqe-deps="aqe code deps"
# alias aqe-gate="aqe quality --gate"
# alias aqe-url="aqe security --url-validate"
#
# Usage:
#   aqe-cov src/                  # coverage gaps with phantom-gap detection
#   aqe-complex src/              # cyclomatic + cognitive metrics
#   aqe-gate                      # quality gate verdict
#   aqe-url https://example.com   # URL safety check
#
# =============================================================================
# COMMANDS WE DELIBERATELY DON'T DEMO
# =============================================================================
#
# These exist in the CLI but the current build doesn't deliver workshop-grade
# output. Avoid promising them to attendees; use the agent-based alternative.
#
#   aqe security --sast / --dast / --compliance
#       Returns "0 vulnerabilities" even on hardcoded credentials + eval() +
#       command injection. Use @qe-security-scanner instead.
#
#   aqe test generate <file>
#       Emits non-compiling TypeScript when the source filename isn't a
#       valid JS identifier (digits, hyphens). Experimental — copy to a
#       clean filename first if you want to try it.
#
#   aqe code search "query"
#       Returns 0 results for our buggy samples even after `aqe code index`.
#       Hypergraph search not yet workshop-ready.
#
# =============================================================================
# PACT ALIGNMENT
# =============================================================================
#
# Proactive    — run the gate before commit, before PR, before deploy
# Autonomous   — each `aqe` call and each agent invocation runs independently
# Collaborative — Markdown / JSON outputs feed humans + tools alike
# Targeted     — `--target`, `--threshold`, agent-specific prompts narrow scope
#
# =============================================================================
# TIP — Makefile pattern:
#
# .PHONY: quality
# quality:
# 	aqe coverage --gaps --threshold 80 src/
# 	aqe code complexity src/
# 	aqe quality --gate
#
# =============================================================================
